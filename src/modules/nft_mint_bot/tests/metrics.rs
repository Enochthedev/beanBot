use nft_mint_bot::metrics::METRICS;

#[test]
fn records_metrics() {
    METRICS.record_success(0.5, 100);
    METRICS.record_error();
    let families = METRICS.registry.gather();
    assert!(!families.is_empty());
}
