import { EventEmitter } from 'events';
import { network } from '@libs/network';

export class BlockStreamer extends EventEmitter {
  private started = false;

  start() {
    if (this.started) return;
    const provider = network.getWebSocketProvider();
    if (!provider) {
      console.warn('No WebSocket RPC URL configured; block streamer disabled');
      return;
    }
    provider.on('block', (blockNumber: number) => {
      this.emit('block', blockNumber);
    });
    this.started = true;
  }
}

export const blockStreamer = new BlockStreamer();
