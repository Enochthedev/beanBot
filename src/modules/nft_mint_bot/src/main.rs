mod config;
mod provider_pool;
use config::Config;
use provider_pool::ProviderPool;
use std::env;
use std::sync::Arc;
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
    let recipient = env::args()
        .nth(1)
        .expect("Recipient address required");
    let address: Address = recipient.parse()?;

    println!("✅ Config loaded: {}", cfg.rpc_url);
    println!("🚀 Minting to: {}", recipient);

    let wallet: LocalWallet = cfg.private_key.parse()?;

    if cfg.rpc_url.starts_with("ws") {
        let pool = ProviderPool::new(cfg.rpc_url.clone(), 3).await?;
        let provider = pool.get_provider().await;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));

        let contract_addr: Address = cfg.contract_address.parse()?;
        let contract = MintContract::new(contract_addr, client.clone());
        let call = contract.mint(address);
        let tx = call.send().await?;
        match tx.await? {
            Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
            None => println!("❌ Transaction dropped"),
        }
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));

        let contract_addr: Address = cfg.contract_address.parse()?;
        let contract = MintContract::new(contract_addr, client.clone());
        let call = contract.mint(address);
        let tx = call.send().await?;
        match tx.await? {
            Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
            None => println!("❌ Transaction dropped"),
        }
    }

    Ok(())
}

