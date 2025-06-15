#[tokio::test]
async fn test_mint_to_burner() {
    use nft_mint_bot::{config::Config, try_provider};
    use ethers::prelude::*;
    use std::sync::Arc;

    dotenv::dotenv().ok(); // Load .env

    let cfg = Config::load();
    let cli = nft_mint_bot::Cli::parse_from(&[
        "test", // binary name placeholder
        "--contract", "0x7376260Cc58D647Ec5c0cE24F4F75515297b89f2",
        "--to", "0x3ce96bD14b70078e029F3F72FEdDEd4d081A16DE",
        "--mode", "mint"
    ]);

    let wallet: LocalWallet = cfg.private_key.parse().unwrap();
    let contract_addr: Address = cli.contract.clone().unwrap().parse().unwrap();
    let abi = serde_json::from_str(include_str!("../abi/basicmint.abi.json")).unwrap();

    let result = try_provider(
        &cfg.rpc_urls[0],
        &wallet,
        contract_addr,
        &cli,
        &cfg,
        abi
    )
    .await
    .unwrap();

    assert!(result.is_some(), "Mint transaction failed");
}