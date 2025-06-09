use nft_mint_bot::config::Config;
use std::env;

#[test]
fn loads_env_vars() {
    env::set_var("PRIMARY_RPC_URL", "ws://localhost:8545");
    env::set_var("PRIVATE_KEY", "abc123");
    env::set_var("CONTRACT_ADDRESS", "0x0000000000000000000000000000000000000000");
    env::set_var("USE_FLASHBOTS", "true");
    env::set_var("MINT_GAS_LIMIT", "123456");
    env::set_var("GAS_MULTIPLIER", "1.5");
    
    let cfg = Config::load();
    
    assert_eq!(cfg.rpc_urls, vec!["ws://localhost:8545".to_string()]);
    assert_eq!(cfg.private_key, "abc123");
    assert_eq!(
        cfg.contract_address,
        "0x0000000000000000000000000000000000000000"
    );
    assert!(cfg.use_flashbots);
    assert_eq!(cfg.gas_limit, Some(123456));
    assert_eq!(cfg.gas_multiplier, 1.5);
}

#[test]
fn loads_env_vars_without_flashbots() {
    env::set_var("PRIMARY_RPC_URL", "http://localhost:8545");
    env::set_var("PRIVATE_KEY", "def456");
    env::set_var("CONTRACT_ADDRESS", "0x1111111111111111111111111111111111111111");
    env::remove_var("USE_FLASHBOTS"); // Ensure it's not set
    env::set_var("MINT_GAS_LIMIT", "654321");
    env::set_var("GAS_MULTIPLIER", "2.0");
    
    let cfg = Config::load();
    
    assert_eq!(cfg.rpc_urls, vec!["http://localhost:8545".to_string()]);
    assert_eq!(cfg.private_key, "def456");
    assert_eq!(
        cfg.contract_address,
        "0x1111111111111111111111111111111111111111"
    );
    assert!(!cfg.use_flashbots); // Should default to false
    assert_eq!(cfg.gas_limit, Some(654321));
    assert_eq!(cfg.gas_multiplier, 2.0);
}

#[test]
fn loads_multiple_rpc_urls() {
    env::set_var("PRIMARY_RPC_URL", "ws://localhost:8545");
    env::set_var("SECONDARY_RPC_URL", "http://localhost:8546");
    env::set_var("TERTIARY_RPC_URL", "wss://mainnet.infura.io/ws/v3/key");
    env::set_var("PRIVATE_KEY", "ghi789");
    env::set_var("CONTRACT_ADDRESS", "0x2222222222222222222222222222222222222222");
    env::set_var("USE_FLASHBOTS", "false");
    
    let cfg = Config::load();
    
    assert_eq!(cfg.rpc_urls, vec![
        "ws://localhost:8545".to_string(),
        "http://localhost:8546".to_string(),
        "wss://mainnet.infura.io/ws/v3/key".to_string()
    ]);
    assert_eq!(cfg.private_key, "ghi789");
    assert_eq!(
        cfg.contract_address,
        "0x2222222222222222222222222222222222222222"
    );
    assert!(!cfg.use_flashbots);
}