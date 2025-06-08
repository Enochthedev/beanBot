use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use anyhow::Result;
use ethers::prelude::*;
use tokio::sync::Mutex;

pub struct ProviderPool {
    url: String,
    providers: Vec<Arc<Mutex<Provider<Ws>>>>,
    next: AtomicUsize,
}

impl ProviderPool {
    /// Create a new pool with the given size. Each provider connects to the same URL.
    pub async fn new(url: String, size: usize) -> Result<Self> {
        let mut providers = Vec::with_capacity(size);
        for _ in 0..size {
            let provider = Provider::<Ws>::connect(&url).await?;
            providers.push(Arc::new(Mutex::new(provider)));
        }
        Ok(Self { url, providers, next: AtomicUsize::new(0) })
    }

    /// Acquire a provider from the pool in round-robin fashion. Performs a basic
    /// health check and reconnects on failure.
    pub async fn get_provider(&self) -> Provider<Ws> {
        let idx = self.next.fetch_add(1, Ordering::SeqCst) % self.providers.len();
        let mut guard = self.providers[idx].lock().await;
        if guard.get_block_number().await.is_err() {
            eprintln!("⚠️  provider {idx} unhealthy, reconnecting...");
            match Provider::<Ws>::connect(&self.url).await {
                Ok(new_provider) => *guard = new_provider,
                Err(err) => eprintln!("❌ failed to reconnect provider {idx}: {err}"),
            }
        }
        guard.clone()
    }
}
