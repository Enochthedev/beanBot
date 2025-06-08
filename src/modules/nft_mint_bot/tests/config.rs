use nft_mint_bot::config::Config;
use std::env;

#[test]
fn loads_env_vars() {
    env::set_var("RPC_URL", "ws://localhost:8545");
    env::set_var("PRIVATE_KEY", "abc123");
    env::set_var(
        "CONTRACT_ADDRESS",
        "0x0000000000000000000000000000000000000000",
    );
    env::set_var("GAS_MULTIPLIER", "1.5");
    let cfg = Config::load();
    assert_eq!(cfg.rpc_url, "ws://localhost:8545");
    assert_eq!(cfg.private_key, "abc123");
    assert_eq!(
        cfg.contract_address,
        "0x0000000000000000000000000000000000000000"
    );
    assert_eq!(cfg.gas_multiplier, 1.5);
}
