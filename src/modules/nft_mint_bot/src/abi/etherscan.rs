use anyhow::{anyhow, Result};
use ethers::abi::Abi;
use redis::AsyncCommands;
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use std::env;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct EtherscanResponse {
    status: String,
    result: String,
}

const CACHE_TTL: usize = 60 * 60; // 1 hour

async fn fetch_with_retry(client: &Client, url: &str) -> Result<String> {
    let mut delay = 1u64;
    for _ in 0..5 {
        match client.get(url).send().await {
            Ok(resp) => {
                if resp.status() == StatusCode::TOO_MANY_REQUESTS {
                    sleep(Duration::from_secs(delay)).await;
                    delay *= 2;
                    continue;
                }
                if resp.status().is_success() {
                    return Ok(resp.text().await?);
                } else {
                    let status = resp.status();
                    let text = resp.text().await.unwrap_or_default();
                    return Err(anyhow!("HTTP {}: {}", status, text));
                }
            }
            Err(e) => {
                if delay < 32 {
                    sleep(Duration::from_secs(delay)).await;
                    delay *= 2;
                } else {
                    return Err(e.into());
                }
            }
        }
    }
    Err(anyhow!("Failed to fetch after retries"))
}

async fn fetch_from_ipfs(cid: &str) -> Result<Abi> {
    let cid = cid.trim_start_matches("ipfs://");
    let url = format!("https://ipfs.io/ipfs/{}", cid);
    let client = Client::new();
    let body = fetch_with_retry(&client, &url).await?;
    let abi: Abi = serde_json::from_str(&body)?;
    validate_abi(&abi)?;
    Ok(abi)
}

fn validate_abi(abi: &Abi) -> Result<()> {
    if abi.function("mint").is_ok()
        || abi.function("mintBatch").is_ok()
        || abi.function("mintWithSignature").is_ok()
    {
        Ok(())
    } else {
        Err(anyhow!("ABI missing required mint function"))
    }
}

/// Fetch ABI from Etherscan or similar compatible explorer
pub async fn fetch_abi(address: &str, network: &str) -> Result<Abi> {
    if address.starts_with("ipfs://") {
        return fetch_from_ipfs(address).await;
    }

    let api_key = env::var("ETHERSCAN_API_KEY")
        .map_err(|_| anyhow!("Missing ETHERSCAN_API_KEY in environment"))?;

    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".into());
    let cache_key = format!("abi:{}:{}", network, address.to_lowercase());

    if let Ok(client) = redis::Client::open(redis_url.clone()) {
        if let Ok(mut conn) = client.get_async_connection().await {
            if let Ok(cached) = conn.get::<_, String>(&cache_key).await {
                if !cached.is_empty() {
                    if let Ok(abi) = serde_json::from_str(&cached) {
                        return Ok(abi);
                    }
                }
            }
        }
    }

    let base_url = match network.to_lowercase().as_str() {
        "sepolia" => "https://api-sepolia.etherscan.io",
        "mainnet" | "ethereum" => "https://api.etherscan.io",
        "polygon" | "matic" => "https://api.polygonscan.com",
        "arbitrum" => "https://api.arbiscan.io",
        "optimism" => "https://api-optimistic.etherscan.io",
        "base" => "https://api.basescan.org",
        _ => return Err(anyhow!("Unsupported network")),
    };

    let url = format!(
        "{}/api?module=contract&action=getabi&address={}&apikey={}",
        base_url, address, api_key
    );

    let client = Client::new();
    let body = fetch_with_retry(&client, &url).await?;
    let res: EtherscanResponse = serde_json::from_str(&body)?;
    if res.status == "1" {
        let abi: Abi = serde_json::from_str(&res.result)?;
        validate_abi(&abi)?;
        if let Ok(redis_client) = redis::Client::open(redis_url) {
            if let Ok(mut conn) = redis_client.get_async_connection().await {
                let _: Result<(), _> = conn.set_ex(&cache_key, res.result, CACHE_TTL).await;
            }
        }
        Ok(abi)
    } else {
        // attempt fallbacks
        let mut last_err = anyhow!("Etherscan error: {}", res.result);
        let fallbacks: Vec<Option<String>> = vec![
            env::var("ALCHEMY_EXPLORER_URL").ok(),
            env::var("ANKR_EXPLORER_URL").ok(),
        ];
        for fb in fallbacks.into_iter().flatten() {
            let url = format!(
                "{}/api?module=contract&action=getabi&address={}&apikey={}",
                fb, address, api_key
            );
            if let Ok(body) = fetch_with_retry(&client, &url).await {
                if let Ok(res) = serde_json::from_str::<EtherscanResponse>(&body) {
                    if res.status == "1" {
                        let abi: Abi = serde_json::from_str(&res.result)?;
                        validate_abi(&abi)?;
                        if let Ok(redis_client) = redis::Client::open(redis_url.clone()) {
                            if let Ok(mut conn) = redis_client.get_async_connection().await {
                                let _: Result<(), _> =
                                    conn.set_ex(&cache_key, res.result, CACHE_TTL).await;
                            }
                        }
                        return Ok(abi);
                    } else {
                        last_err = anyhow!("{} error: {}", fb, res.result);
                    }
                }
            }
        }
        Err(last_err)
    }
}
