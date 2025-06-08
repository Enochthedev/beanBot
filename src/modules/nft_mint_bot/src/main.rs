mod config;
use config::Config;
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
    let client: Arc<dyn Middleware> = if cfg.rpc_url.starts_with("ws") {
        let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
        Arc::new(SignerMiddleware::new(provider, wallet.clone()))
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        Arc::new(SignerMiddleware::new(provider, wallet.clone()))
    };

    let contract_addr: Address = cfg.contract_address.parse()?;
    let contract = MintContract::new(contract_addr, client.clone());
    let tx = contract.mint(address).send().await?;
    let receipt = tx.await?.transaction_hash;
    println!("✅ Minted in tx: {:#x}", receipt);
    Ok(())
}