mod config;
use config::Config;

#[tokio::main]
async fn main() {
    let cfg = Config::load();
    println!("✅ Config loaded: {}", cfg.rpc_url);
}