pub mod etherscan;

use ethers::abi::Abi;
use anyhow::Result;

pub async fn auto_fetch_abi(address: &str, network: &str) -> Result<Abi> {
    etherscan::fetch_abi(address, network).await
}
