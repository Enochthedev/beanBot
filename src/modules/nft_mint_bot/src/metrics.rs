use once_cell::sync::Lazy;
use prometheus::{Encoder, Histogram, HistogramOpts, IntCounter, Registry, TextEncoder};
use hyper::{Body, Request, Response, Server};
use hyper::service::{make_service_fn, service_fn};

pub static METRICS: Lazy<Metrics> = Lazy::new(Metrics::new);

pub struct Metrics {
    pub registry: Registry,
    tx_latency: Histogram,
    gas_spent: Histogram,
    error_count: IntCounter,
}

impl Metrics {
    fn new() -> Self {
        let registry = Registry::new();
        let tx_latency = Histogram::with_opts(HistogramOpts::new(
            "tx_latency_seconds",
            "Transaction latency in seconds",
        ))
        .unwrap();
        let gas_spent = Histogram::with_opts(HistogramOpts::new(
            "tx_gas_spent",
            "Gas used for mint transactions",
        ))
        .unwrap();
        let error_count = IntCounter::new("tx_errors_total", "Total mint errors").unwrap();
        registry.register(Box::new(tx_latency.clone())).unwrap();
        registry.register(Box::new(gas_spent.clone())).unwrap();
        registry.register(Box::new(error_count.clone())).unwrap();
        Self {
            registry,
            tx_latency,
            gas_spent,
            error_count,
        }
    }

    pub fn record_success(&self, latency: f64, gas: u64) {
        self.tx_latency.observe(latency);
        self.gas_spent.observe(gas as f64);
    }

    pub fn record_error(&self) {
        self.error_count.inc();
    }
}

async fn metrics_handler(_req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    let metric_families = METRICS.registry.gather();
    let mut buffer = Vec::new();
    let encoder = TextEncoder::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    Ok(Response::builder()
        .header("Content-Type", encoder.format_type())
        .body(Body::from(buffer))
        .unwrap())
}

async fn serve_inner(port: u16) {
    let addr = ([0, 0, 0, 0], port).into();
    let make_svc = make_service_fn(|_conn| async { Ok::<_, hyper::Error>(service_fn(metrics_handler)) });
    if let Err(err) = Server::bind(&addr).serve(make_svc).await {
        eprintln!("Metrics server error: {err}");
    }
}

pub fn init() {
    let port: u16 = std::env::var("MINT_BOT_METRICS_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(9101);
    tokio::spawn(serve_inner(port));
}
