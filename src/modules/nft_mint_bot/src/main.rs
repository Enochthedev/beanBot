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

    let provider = Provider::<Ws>::connect(cfg.rpc_url).await?;
    let wallet: LocalWallet = cfg.private_key.parse()?;
    let client = SignerMiddleware::new(provider, wallet);
    let client = Arc::new(client);

    let contract_addr: Address = cfg.contract_address.parse()?;
    let contract = MintContract::new(contract_addr, client.clone());
    let call = contract.mint(address);
    let tx = call.send().await?;
    match tx.await? {
        Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
        None => println!("❌ Transaction dropped"),
    }
    Ok(())
}

