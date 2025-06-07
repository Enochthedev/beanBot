mod config;
use config::Config;
use std::env;

/// Simple CLI entry for the mint bot.
/// Pass the recipient address as the first argument.

#[tokio::main]
async fn main() {
    let cfg = Config::load();
    let recipient = env::args().nth(1).unwrap_or_default();
    println!("✅ Config loaded: {}", cfg.rpc_url);
    println!("Minting to: {}", recipient);
    // TODO: Implement high performance minting logic using `ethers` here.
}