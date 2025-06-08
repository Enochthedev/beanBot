use anyhow::Result;
use ethers::prelude::*;

/// Estimate the gas limit for a contract call
pub async fn estimate_gas_limit<M>(call: ContractCall<M, ()>) -> Result<U256>
where
    M: Middleware + 'static,
{
    let gas = call.estimate_gas().await?;
    Ok(gas)
}
