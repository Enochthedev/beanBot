mod config;
mod gas;
mod provider_pool;

use anyhow::Result;
use config::Config;
use ethers::prelude::*;
use gas::estimate_gas_limit;
use hex::decode;
use provider_pool::ProviderPool;
use std::env;
use std::sync::Arc;

fn apply_multiplier(value: U256, multiplier: f64) -> U256 {
    let scaled = (value.as_u128() as f64 * multiplier) as u128;
    U256::from(scaled)
}

abigen!(
    MintContract,
    r#"[
        function mint(address to) external
        function mintBatch(address[] to, uint256[] amounts) external
        function mintWithSignature(address to, uint256 amount, bytes signature) external
    ]"#
);

#[tokio::main]
async fn main() -> Result<()> {
    let cfg = Config::load();
    let mut args: Vec<String> = env::args().skip(1).collect();

    // Determine mint mode
    let mut mode = "mint".to_string();
    if let Some(first) = args.first() {
        match first.as_str() {
            "mint" | "batch" | "signed" => {
                mode = first.clone();
                args.remove(0);
            }
            _ => {}
        }
    }

    println!("✅ Loaded {} RPC URL(s)", cfg.rpc_urls.len());
    println!("🚀 Mode: {}", mode);

    let wallet: LocalWallet = cfg.private_key.parse()?;
    let contract_addr: Address = cfg.contract_address.parse()?;

    let mut last_err: Option<anyhow::Error> = None;
    for url in &cfg.rpc_urls {
        println!("🔗 Trying provider: {}", url);

        let provider_result = if url.starts_with("ws") {
            match ProviderPool::new(url.clone(), 3).await {
                Ok(pool) => Ok(pool.get_provider().await),
                Err(e) => Err(e.into()),
            }
        } else {
            Provider::<Http>::try_from(url.as_str()).map_err(Into::into)
        };

        match provider_result {
            Ok(provider) => {
                let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
                let contract = MintContract::new(contract_addr, client.clone());
                match execute_mint(&mode, &args, contract, &cfg).await {
                    Ok(Some(receipt)) => {
                        println!("✅ Minted in tx: {:#x}", receipt.transaction_hash);
                        return Ok(());
                    }
                    Ok(None) => {
                        println!("❌ Transaction dropped");
                        return Ok(());
                    }
                    Err(e) => {
                        eprintln!("⚠️ Mint failed on {}: {}", url, e);
                        last_err = Some(e);
                    }
                }
            }
            Err(e) => {
                eprintln!("❌ Provider error on {}: {}", url, e);
                last_err = Some(e);
            }
        }
    }

    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("All RPC providers failed")))
}

async fn execute_mint<M: Middleware + 'static>(
    mode: &str,
    args: &[String],
    contract: MintContract<M>,
    cfg: &Config,
) -> Result<Option<TransactionReceipt>> {
    match mode {
        "batch" => {
            let addresses_arg = args.get(0).expect("Recipient addresses required");
            let amounts_arg = args.get(1).expect("Amounts required");

            let addresses: Result<Vec<Address>> = addresses_arg
                .split(',')
                .map(|a| a.parse().map_err(Into::into))
                .collect();
            let amounts: Result<Vec<U256>> = amounts_arg
                .split(',')
                .map(|a| U256::from_dec_str(a).map_err(Into::into))
                .collect();

            let mut call = contract.mint_batch(addresses?, amounts?);
            call = call_with_gas(call, contract.client(), cfg).await?;
            let pending = call.send().await?;
            Ok(pending.await?)
        }

        "signed" => {
            let recipient = args.get(0).expect("Recipient address required");
            let amount = args.get(1).expect("Amount required");
            let sig = args.get(2).expect("Signature required");

            let address: Address = recipient.parse()?;
            let qty = U256::from_dec_str(amount)?;
            let bytes = decode(sig.trim_start_matches("0x"))?;

            let mut call = contract.mint_with_signature(address, qty, Bytes::from(bytes));
            call = call_with_gas(call, contract.client(), cfg).await?;
            let pending = call.send().await?;
            Ok(pending.await?)
        }

        _ => {
            let recipient = args.get(0).expect("Recipient address required");
            let address: Address = recipient.parse()?;
            println!("🚀 Minting to: {}", recipient);

            let mut call = contract.mint(address);
            call = call_with_gas(call, contract.client(), cfg).await?;
            let pending = call.send().await?;
            Ok(pending.await?)
        }
    }
}

async fn call_with_gas<M: Middleware + 'static>(
    mut call: ContractCall<M, ()>,
    client: &Arc<SignerMiddleware<M, LocalWallet>>,
    cfg: &Config,
) -> Result<ContractCall<M, ()>> {
    let gas_limit = if let Some(limit) = cfg.gas_limit {
        U256::from(limit)
    } else {
        estimate_gas_limit(call.clone()).await?
    };
    call = call.gas(gas_limit);

    if let Some(tx) = call.tx.as_eip1559_mut() {
        let (max_fee, prio_fee) = client.estimate_eip1559_fees(None).await?;
        tx.max_fee_per_gas = Some(apply_multiplier(max_fee, cfg.gas_multiplier));
        tx.max_priority_fee_per_gas = Some(apply_multiplier(prio_fee, cfg.gas_multiplier));
    }

    Ok(call)
}