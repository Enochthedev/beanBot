mod config;
use config::Config;
use std::env;
use std::sync::Arc;
use ethers::prelude::*;
use anyhow::Result;
use ethers::types::Bytes;
use hex::decode;

abigen!(
    MintContract,
    r#"[
        function mint(address to) external
        function mintBatch(address[] to, uint256[] amounts) external
        function mintWithSignature(address to, uint256 amount, bytes signature) external
    ]"#
);

/// Simple CLI entry for the mint bot.
/// Pass the recipient address as the first argument.

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

    println!("✅ Config loaded: {}", cfg.rpc_url);
    println!("🚀 Mode: {}", mode);

    let wallet: LocalWallet = cfg.private_key.parse()?;
    let contract_addr: Address = cfg.contract_address.parse()?;

    let receipt = if cfg.rpc_url.starts_with("ws") {
        let provider = Provider::<Ws>::connect(&cfg.rpc_url).await?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract = MintContract::new(contract_addr, client.clone());
        execute_mint(&mode, &args, contract).await?
    } else {
        let provider = Provider::<Http>::try_from(cfg.rpc_url.as_str())?;
        let client = Arc::new(SignerMiddleware::new(provider, wallet.clone()));
        let contract = MintContract::new(contract_addr, client.clone());
        execute_mint(&mode, &args, contract).await?
    };

    match receipt {
        Some(r) => println!("✅ Minted in tx: {:#x}", r.transaction_hash),
        None => println!("❌ Transaction dropped"),
    }

    Ok(())
}

async fn execute_mint<M: Middleware + 'static>(
    mode: &str,
    args: &[String],
    contract: MintContract<M>,
) -> Result<Option<TransactionReceipt>> {
    let receipt = match mode {
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
            {
                let call = contract.mint_batch(addresses?, amounts?);
                let pending = call.send().await?;
                pending.await?
            }
        }
        "signed" => {
            let recipient = args.get(0).expect("Recipient address required");
            let amount = args.get(1).expect("Amount required");
            let sig = args.get(2).expect("Signature required");
            let address: Address = recipient.parse()?;
            let qty = U256::from_dec_str(amount)?;
            let bytes = decode(sig.trim_start_matches("0x"))?;
            {
                let call = contract
                    .mint_with_signature(address, qty, Bytes::from(bytes));
                let pending = call.send().await?;
                pending.await?
            }
        }
        _ => {
            let recipient = args.get(0).expect("Recipient address required");
            let address: Address = recipient.parse()?;
            println!("🚀 Minting to: {}", recipient);
            {
                let call = contract.mint(address);
                let pending = call.send().await?;
                pending.await?
            }
        }
    };
    Ok(receipt)
}

