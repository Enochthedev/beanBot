use nft_mint_bot::config::Config;
use std::env;

#[test]
fn loads_env_vars() {
    env::set_var("PRIMARY_RPC_URL", "ws://localhost:8545");
    env::set_var("PRIVATE_KEY", "abc123");
    env::set_var("CONTRACT_ADDRESS", "0x0000000000000000000000000000000000000000");
    let cfg = Config::load();
    assert_eq!(cfg.rpc_urls, vec!["ws://localhost:8545".to_string()]);
    assert_eq!(cfg.private_key, "abc123");
    assert_eq!(cfg.contract_address, "0x0000000000000000000000000000000000000000");
}
