mod config;
mod metrics;
use config::Config;
use metrics::METRICS;
use std::env;
use std::sync::Arc;
use std::time::Instant;
use ethers::prelude::*;
use anyhow::Result;

abigen!(
    MintContract,
    r#"[
        function mint(address to) external
    ]"#
);

/// Simple CLI entry for the mint bot.
/// Pass the recipient address as the first argument.

#[tokio::main]
async fn main() -> Result<()> {
    let cfg = Config::load();
    metrics::init();
    let recipient = env::args()
        .nth(1)
        .expect("Recipient address required");
    let address: Address = recipient.parse()?;

    println!("✅ Config loaded: {}", cfg.rpc_url);
    println!("🚀 Minting to: {}", recipient);

    let wallet: LocalWallet = cfg.private_key.parse()?;

    if cfg.rpc_url.starts_with("ws") {
        let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract_addr: Address = cfg.contract_address.parse()?;
        let contract = MintContract::new(contract_addr, client.clone());
        let call = contract.mint(address);
        let start = Instant::now();
        let tx = match call.send().await {
            Ok(tx) => tx,
            Err(err) => {
                METRICS.record_error();
                return Err(err.into());
            }
        };
        match tx.await {
            Ok(Some(receipt)) => {
                let gas = receipt.gas_used.unwrap_or_default().as_u64();
                METRICS.record_success(start.elapsed().as_secs_f64(), gas);
                println!("✅ Minted in tx: {:#x}", receipt.transaction_hash);
            }
            Ok(None) => {
                METRICS.record_error();
                println!("❌ Transaction dropped");
            }
            Err(err) => {
                METRICS.record_error();
                return Err(err.into());
            }
        }
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract_addr: Address = cfg.contract_address.parse()?;
        let contract = MintContract::new(contract_addr, client.clone());
        let call = contract.mint(address);
        let start = Instant::now();
        let tx = match call.send().await {
            Ok(tx) => tx,
            Err(err) => {
                METRICS.record_error();
                return Err(err.into());
            }
        };
        match tx.await {
            Ok(Some(receipt)) => {
                let gas = receipt.gas_used.unwrap_or_default().as_u64();
                METRICS.record_success(start.elapsed().as_secs_f64(), gas);
                println!("✅ Minted in tx: {:#x}", receipt.transaction_hash);
            }
            Ok(None) => {
                METRICS.record_error();
                println!("❌ Transaction dropped");
            }
            Err(err) => {
                METRICS.record_error();
                return Err(err.into());
            }
        }
    }

    Ok(())
}

