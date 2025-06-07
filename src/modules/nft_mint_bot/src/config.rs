use dotenv::dotenv;
use std::env;

pub struct Config {
    pub rpc_url: String,
    pub private_key: String,
    pub contract_address: String,
}

impl Config {
    pub fn load() -> Self {
        dotenv().ok();
        Self {
            rpc_url: env::var("RPC_URL").expect("RPC_URL not set"),
            private_key: env::var("PRIVATE_KEY").expect("PRIVATE_KEY not set"),
            contract_address: env::var("CONTRACT_ADDRESS").expect("CONTRACT_ADDRESS not set"),
        }
    }
}