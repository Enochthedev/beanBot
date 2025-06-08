import express from 'express';
import client from 'prom-client';
import { MintQueue } from './mint/queue';

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export function initMetrics(queue: MintQueue) {
  if (process.env.ENABLE_PERFORMANCE_MONITORING !== 'true') return;

  const sizeGauge = new client.Gauge({ name: 'mint_queue_size', help: 'Queued mint requests' });
  registry.registerMetric(sizeGauge);

  queue.on('queued', () => sizeGauge.set(queue.length));
  queue.on('processed', () => sizeGauge.set(queue.length));
  queue.on('failed', () => sizeGauge.set(queue.length));

  const app = express();
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  });
  const port = parseInt(process.env.METRICS_PORT ?? '9090', 10);
  app.listen(port, () => console.log(`Metrics server running on ${port}`));
}
