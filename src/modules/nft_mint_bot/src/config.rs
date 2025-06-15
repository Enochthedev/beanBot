use dotenv::dotenv;
use std::env;

#[derive(Debug)]
pub struct Config {
    pub rpc_urls: Vec<String>,
    pub private_key: String,
    pub contract_address: Option<String>,
    pub use_flashbots: bool,
    pub gas_limit: Option<u64>,
    pub gas_multiplier: f64,
    pub auto_fetch_abi: Option<bool>,

}

impl Config {
    pub fn load() -> Self {
        dotenv().ok();
        let mut rpc_urls = vec![];
        if let Ok(url) = env::var("PRIMARY_RPC_URL") {
            if !url.is_empty() {
                rpc_urls.push(url);
            }
        }
        if let Ok(url) = env::var("SECONDARY_RPC_URL") {
            if !url.is_empty() {
                rpc_urls.push(url);
            }
        }
        if let Ok(url) = env::var("TERTIARY_RPC_URL") {
            if !url.is_empty() {
                rpc_urls.push(url);
            }
        }
        if rpc_urls.is_empty() {
            if let Ok(url) = env::var("RPC_URL") {
                if !url.is_empty() {
                    rpc_urls.push(url);
                }
            }
        }
        if rpc_urls.is_empty() {
            panic!("No RPC URLs configured");
        }
        Self {
            rpc_urls,
            private_key: env::var("PRIVATE_KEY").expect("PRIVATE_KEY not set"),
            contract_address: env::var("CONTRACT_ADDRESS").ok(),
            use_flashbots: env::var("USE_FLASHBOTS")
                .unwrap_or_else(|_| "false".to_string())
                .to_lowercase()
                == "true",
            gas_limit: env::var("MINT_GAS_LIMIT").ok().and_then(|v| v.parse().ok()),
            gas_multiplier: env::var("GAS_MULTIPLIER")
                .unwrap_or_else(|_| "1.0".into())
                .parse()
                .expect("invalid GAS_MULTIPLIER"),
            auto_fetch_abi: env::var("AUTO_FETCH_ABI").ok().map(|v| v.to_lowercase() == "true"),

        }
    }
}
