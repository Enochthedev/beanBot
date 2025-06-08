use dotenv::dotenv;
use std::env;

#[derive(Debug)]
pub struct Config {
    pub rpc_url: String,
    pub private_key: String,
    pub contract_address: String,
    pub use_flashbots: bool,
}

impl Config {
    pub fn load() -> Self {
        dotenv().ok();
        Self {
            rpc_url: env::var("RPC_URL").expect("RPC_URL not set"),
            private_key: env::var("PRIVATE_KEY").expect("PRIVATE_KEY not set"),
            contract_address: env::var("CONTRACT_ADDRESS").expect("CONTRACT_ADDRESS not set"),
            use_flashbots: env::var("USE_FLASHBOTS")
                .unwrap_or_else(|_| "false".to_string())
                .to_lowercase()
                == "true",
        }
    }
}
