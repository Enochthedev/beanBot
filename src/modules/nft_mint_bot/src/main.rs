mod config;
use config::Config;
use std::env;
use ethers::prelude::*;
use std::sync::Arc;
use ethers_flashbots::FlashbotsMiddleware;
use url::Url;
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

    let contract_addr: Address = cfg.contract_address.parse()?;

    if cfg.use_flashbots {
        if cfg.rpc_url.starts_with("ws") {
            let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
            let fb = FlashbotsMiddleware::new(
                provider,
                Url::parse("https://relay.flashbots.net")?,
                wallet.clone(),
            );
            let client = Arc::new(SignerMiddleware::new(fb, wallet.clone()));
            let contract = MintContract::new(contract_addr, client.clone());
            let call = contract.mint(address);
            let pending = call.send().await?;
            match pending.await? {
                Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
                None => println!("❌ Transaction dropped"),
            }
        } else {
            let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
            let fb = FlashbotsMiddleware::new(
                provider,
                Url::parse("https://relay.flashbots.net")?,
                wallet.clone(),
            );
            let client = Arc::new(SignerMiddleware::new(fb, wallet.clone()));
            let contract = MintContract::new(contract_addr, client.clone());
            let call = contract.mint(address);
            let pending = call.send().await?;
            match pending.await? {
                Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
                None => println!("❌ Transaction dropped"),
            }
        }
    } else if cfg.rpc_url.starts_with("ws") {
        let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract = MintContract::new(contract_addr, client.clone());
        let call = contract.mint(address);
        let pending = call.send().await?;
        match pending.await? {
            Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
            None => println!("❌ Transaction dropped"),
        }
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract = MintContract::new(contract_addr, client.clone());
        let call = contract.mint(address);
        let pending = call.send().await?;
        match pending.await? {
            Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
            None => println!("❌ Transaction dropped"),
        }
    }

    Ok(())
}

