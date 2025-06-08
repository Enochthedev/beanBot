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

    println!("✅ Loaded {} RPC URL(s)", cfg.rpc_urls.len());
    println!("🚀 Minting to: {}", recipient);

    let wallet: LocalWallet = cfg.private_key.parse()?;
    let contract_addr: Address = cfg.contract_address.parse()?;

    let mut last_err: Option<anyhow::Error> = None;
    for url in &cfg.rpc_urls {
        println!("🔗 Using provider: {}", url);
        if url.starts_with("ws") {
            match Ws::connect(url).await {
                Ok(ws) => {
                    let provider = Provider::new(ws);
                    let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
                    let contract = MintContract::new(contract_addr, client.clone());
                    match contract.mint(address).send().await {
                        Ok(pending) => match pending.await? {
                            Some(receipt) => {
                                println!("✅ Minted in tx: {:#x}", receipt.transaction_hash);
                                return Ok(());
                            }
                            None => {
                                println!("❌ Transaction dropped");
                                return Ok(());
                            }
                        },
                        Err(e) => {
                            eprintln!("RPC provider failed: {}", e);
                            last_err = Some(e.into());
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to connect to {}: {}", url, e);
                    last_err = Some(e.into());
                }
            }
        } else {
            match Provider::<Http>::try_from(url.as_str()) {
                Ok(provider) => {
                    let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
                    let contract = MintContract::new(contract_addr, client.clone());
                    match contract.mint(address).send().await {
                        Ok(pending) => match pending.await? {
                            Some(receipt) => {
                                println!("✅ Minted in tx: {:#x}", receipt.transaction_hash);
                                return Ok(());
                            }
                            None => {
                                println!("❌ Transaction dropped");
                                return Ok(());
                            }
                        },
                        Err(e) => {
                            eprintln!("RPC provider failed: {}", e);
                            last_err = Some(e.into());
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to connect to {}: {}", url, e);
                    last_err = Some(e.into());
                }
            }
        }
    }

    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("All RPC providers failed")))
}

