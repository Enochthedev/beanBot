mod config;
use anyhow::Result;
use config::Config;
use ethers::prelude::*;
use std::env;
use std::sync::Arc;
fn apply_multiplier(value: U256, multiplier: f64) -> U256 {
    let scaled = (value.as_u128() as f64 * multiplier) as u128;
    U256::from(scaled)
}

async fn mint_with_provider<P>(
    provider: Provider<P>,
    wallet: LocalWallet,
    cfg: Config,
    address: Address,
) -> Result<()>
where
    P: JsonRpcClient + 'static,
{
    let client = Arc::new(SignerMiddleware::new(provider, wallet));

    let (max_fee, prio_fee) = client.estimate_eip1559_fees(None).await?;

    let contract_addr: Address = cfg.contract_address.parse()?;
    let mut call = MintContract::new(contract_addr, client.clone()).mint(address);

    if let Some(tx) = call.tx.as_eip1559_mut() {
        tx.max_fee_per_gas = Some(apply_multiplier(max_fee, cfg.gas_multiplier));
        tx.max_priority_fee_per_gas = Some(apply_multiplier(prio_fee, cfg.gas_multiplier));
    }

    let pending = call.send().await?;
    match pending.await? {
        Some(receipt) => println!("✅ Minted in tx: {:#x}", receipt.transaction_hash),
        None => println!("❌ Transaction dropped"),
    }

    Ok(())
}

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

    if cfg.rpc_url.starts_with("ws") {
        let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
        mint_with_provider(provider, wallet, cfg, address).await
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        mint_with_provider(provider, wallet, cfg, address).await
    }
}
