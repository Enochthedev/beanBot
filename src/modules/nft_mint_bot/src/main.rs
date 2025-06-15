mod config;
mod gas;
mod metrics;
mod provider_pool;

use anyhow::{anyhow, Result};
use clap::{Parser, ValueEnum};
use config::Config;
use ethers::abi::{Abi, AbiParser};
use ethers::prelude::*;
use gas::estimate_gas_limit;
use hex::decode;
use metrics::METRICS;
use provider_pool::ProviderPool;
use std::fs;
use std::sync::Arc;
use std::time::Instant;
use ethers_flashbots::FlashbotsMiddleware;
use url::Url;

/// Apply a multiplier to a gas value
fn apply_multiplier(value: U256, multiplier: f64) -> U256 {
    let scaled = (value.as_u128() as f64 * multiplier) as u128;
    U256::from(scaled)
}

const DEFAULT_ABI: &str = r#"[
    function mint(address to) external,
    function mintBatch(address[] to, uint256[] amounts) external,
    function mintWithSignature(address to, uint256 amount, bytes signature) external
]"#;

#[derive(Clone, Debug, ValueEnum)]
enum Mode {
    Mint,
    Batch,
    Signed,
}

/// Command line arguments
#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Cli {
    /// Target contract address
    #[arg(long)]
    contract: Option<String>,
    /// Minting mode
    #[arg(long, value_enum, default_value_t = Mode::Mint)]
    mode: Mode,
    /// Recipient address or comma separated list (for batch)
    #[arg(long)]
    to: Option<String>,
    /// Amount for signed mints or comma list for batch
    #[arg(long)]
    amount: Option<String>,
    /// Signature for signed mint
    #[arg(long)]
    signature: Option<String>,
    /// Path to ABI JSON file
    #[arg(long)]
    abi: Option<String>,
    /// Override mint function name (mint mode only)
    #[arg(long)]
    mint_function: Option<String>,
    /// Override gas limit
    #[arg(long)]
    gas_limit: Option<u64>,
    /// ETH value to send with tx
    #[arg(long)]
    value: Option<String>,
    /// Legacy positional recipient
    recipient: Option<String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    metrics::init();
    let cfg = Config::load();
    let cli = Cli::parse();

    println!("✅ Loaded {} RPC URL(s)", cfg.rpc_urls.len());
    println!("🚀 Mode: {:?}", cli.mode);
    if cfg.use_flashbots {
        println!("⚡ Flashbots enabled");
    }

    let wallet: LocalWallet = cfg.private_key.parse()?;
    let contract_addr_str = cli
        .contract
        .clone()
        .or_else(|| cfg.contract_address.clone())
        .ok_or_else(|| anyhow!("Contract address must be provided"))?;
    let contract_addr: Address = contract_addr_str.parse()?;

    let abi: Abi = if let Some(path) = cli.abi.as_deref() {
        let data = fs::read_to_string(path)?;
        serde_json::from_str(&data)?
    } else {
        AbiParser::default().parse_str(DEFAULT_ABI)?
    };

    let mut last_err: Option<anyhow::Error> = None;
    for url in &cfg.rpc_urls {
        println!("🔗 Trying provider: {}", url);
        match try_provider(url, &wallet, contract_addr, &cli, &cfg, abi.clone())
            .await
        {
            Ok(Some(receipt)) => {
                let gas = receipt.gas_used.unwrap_or_default().as_u64();
                METRICS.record_success(Instant::now().elapsed().as_secs_f64(), gas);
                println!("✅ Minted in tx: {:#x}", receipt.transaction_hash);
                return Ok(());
            }
            Ok(None) => {
                METRICS.record_error();
                println!("❌ Transaction dropped");
                return Ok(());
            }
            Err(e) => {
                METRICS.record_error();
                eprintln!("⚠️ Provider failed on {}: {}", url, e);
                last_err = Some(e);
            }
        }
    }

    Err(last_err.unwrap_or_else(|| anyhow!("All RPC providers failed")))
}

async fn try_provider(
    url: &str,
    wallet: &LocalWallet,
    contract_addr: Address,
    cli: &Cli,
    cfg: &Config,
    abi: Abi,
) -> Result<Option<TransactionReceipt>> {
    if cfg.use_flashbots {
        if url.starts_with("ws") {
            let provider = Provider::<Ws>::connect(url).await?;
            let fb = FlashbotsMiddleware::new(provider, Url::parse("https://relay.flashbots.net")?, wallet.clone());
            let client = Arc::new(SignerMiddleware::new(fb, wallet.clone()));
            let contract = Contract::new(contract_addr, abi, client);
            execute_mint(cli, contract, cfg).await
        } else {
            let provider = Provider::<Http>::try_from(url)?;
            let fb = FlashbotsMiddleware::new(provider, Url::parse("https://relay.flashbots.net")?, wallet.clone());
            let client = Arc::new(SignerMiddleware::new(fb, wallet.clone()));
            let contract = Contract::new(contract_addr, abi, client);
            execute_mint(cli, contract, cfg).await
        }
    } else if url.starts_with("ws") {
        match ProviderPool::new(url.to_string(), 3).await {
            Ok(pool) => {
                let provider = pool.get_provider().await;
                let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
                let contract = Contract::new(contract_addr, abi, client);
                execute_mint(cli, contract, cfg).await
            }
            Err(e) => Err(e.into()),
        }
    } else {
        let provider = Provider::<Http>::try_from(url)?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract = Contract::new(contract_addr, abi, client);
        execute_mint(cli, contract, cfg).await
    }
}

async fn execute_mint<M: Middleware + 'static>(
    cli: &Cli,
    contract: Contract<M>,
    cfg: &Config,
) -> Result<Option<TransactionReceipt>> {
    let func = cli.mint_function.clone().unwrap_or_else(|| match cli.mode {
        Mode::Mint => "mint".to_string(),
        Mode::Batch => "mintBatch".to_string(),
        Mode::Signed => "mintWithSignature".to_string(),
    });

    match cli.mode {
        Mode::Batch => {
            let addresses_arg = cli
                .to
                .as_deref()
                .or(cli.recipient.as_deref())
                .ok_or_else(|| anyhow!("Recipient addresses required"))?;
            let amounts_arg = cli
                .amount
                .as_deref()
                .ok_or_else(|| anyhow!("Amounts required"))?;

            let addresses: Result<Vec<Address>> = addresses_arg
                .split(',')
                .map(|a| a.parse().map_err(Into::into))
                .collect();
            let amounts: Result<Vec<U256>> = amounts_arg
                .split(',')
                .map(|a| U256::from_dec_str(a).map_err(Into::into))
                .collect();

            let mut call = contract.method::<_, ()>(&func, (addresses?, amounts?))?;
            call = call_with_gas(call, contract.client().clone(), cfg, cli).await?;
            let pending = call.send().await?;
            Ok(pending.await?)
        }
        Mode::Signed => {
            let recipient = cli
                .to
                .as_deref()
                .or(cli.recipient.as_deref())
                .ok_or_else(|| anyhow!("Recipient address required"))?;
            let amount = cli
                .amount
                .as_deref()
                .ok_or_else(|| anyhow!("Amount required"))?;
            let sig = cli
                .signature
                .as_deref()
                .ok_or_else(|| anyhow!("Signature required"))?;
            let address: Address = recipient.parse()?;
            let qty = U256::from_dec_str(amount)?;
            let bytes = decode(sig.trim_start_matches("0x"))?;

            let mut call = contract.method::<_, ()>(&func, (address, qty, Bytes::from(bytes)))?;
            call = call_with_gas(call, contract.client().clone(), cfg, cli).await?;
            let pending = call.send().await?;
            Ok(pending.await?)
        }
        Mode::Mint => {
            let recipient = cli
                .to
                .as_deref()
                .or(cli.recipient.as_deref())
                .ok_or_else(|| anyhow!("Recipient address required"))?;
            let address: Address = recipient.parse()?;
            println!("🚀 Minting to: {}", recipient);

            let mut call = contract.method::<_, ()>(&func, address)?;
            call = call_with_gas(call, contract.client().clone(), cfg, cli).await?;
            let pending = call.send().await?;
            Ok(pending.await?)
        }
    }
}

async fn call_with_gas<M: Middleware + 'static>(
    mut call: ContractCall<M, ()>,
    client: Arc<M>,
    cfg: &Config,
    cli: &Cli,
) -> Result<ContractCall<M, ()>> {
    let gas_limit = if let Some(limit) = cli.gas_limit.or(cfg.gas_limit) {
        U256::from(limit)
    } else {
        estimate_gas_limit(call.clone()).await?
    };
    call = call.gas(gas_limit);

    if let Some(val) = &cli.value {
        let value = U256::from_dec_str(val)?;
        call = call.value(value);
    }

    if let Some(tx) = call.tx.as_eip1559_mut() {
        let (max_fee, prio_fee) = client.estimate_eip1559_fees(None).await?;
        tx.max_fee_per_gas = Some(apply_multiplier(max_fee, cfg.gas_multiplier));
        tx.max_priority_fee_per_gas =
            Some(apply_multiplier(prio_fee, cfg.gas_multiplier));
    }

    Ok(call)
}
