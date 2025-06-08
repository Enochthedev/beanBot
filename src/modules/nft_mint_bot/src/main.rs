mod config;
mod gas;
use anyhow::Result;
use config::Config;
use ethers::prelude::*;
use gas::estimate_gas_limit;
use std::env;
use std::sync::Arc;

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
    let recipient = env::args().nth(1).expect("Recipient address required");
    let address: Address = recipient.parse()?;

    println!("✅ Config loaded: {}", cfg.rpc_url);
    println!("🚀 Minting to: {}", recipient);

    let wallet: LocalWallet = cfg.private_key.parse()?;
    let contract_addr: Address = cfg.contract_address.parse()?;

    if cfg.rpc_url.starts_with("ws") {
        let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let mut call = MintContract::new(contract_addr, client.clone()).mint(address);
        let gas_limit = if let Some(limit) = cfg.gas_limit {
            U256::from(limit)
        } else {
            estimate_gas_limit(call.clone()).await?
        };
        call = call.gas(gas_limit);
        let tx = call.send().await?;
        match tx.await? {
            Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
            None => println!("❌ Transaction dropped"),
        }
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let mut call = MintContract::new(contract_addr, client.clone()).mint(address);
        let gas_limit = if let Some(limit) = cfg.gas_limit {
            U256::from(limit)
        } else {
            estimate_gas_limit(call.clone()).await?
        };
        call = call.gas(gas_limit);
        let tx = call.send().await?;
        match tx.await? {
            Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
            None => println!("❌ Transaction dropped"),
        }
    }

    Ok(())
}
