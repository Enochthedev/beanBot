import { JsonRpcProvider, WebSocketProvider } from 'ethers';
import { config } from '@config/index';

export class NetworkManager {
  private rpcUrls: string[] = config.rpcUrls;
  private providerIndex = 0;
  private provider: JsonRpcProvider;
  private wsProvider?: WebSocketProvider;

  constructor() {
    if (this.rpcUrls.length === 0) {
      throw new Error('No RPC URLs configured');
    }
    this.provider = new JsonRpcProvider(this.rpcUrls[this.providerIndex]);
  }

  /** Get the current JSON-RPC provider */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /** Execute a function with failover across configured RPC providers */
  async withProvider<T>(fn: (provider: JsonRpcProvider) => Promise<T>): Promise<T> {
    const startIndex = this.providerIndex;
    for (let i = 0; i < this.rpcUrls.length; i++) {
      const index = (startIndex + i) % this.rpcUrls.length;
      const url = this.rpcUrls[index];
      const provider = new JsonRpcProvider(url);
      try {
        const res = await fn(provider);
        // switch to the working provider for future requests
        this.providerIndex = index;
        this.provider = provider;
        return res;
      } catch (err) {
        console.warn(`RPC provider failed: ${url}`);
        if (i === this.rpcUrls.length - 1) {
          throw err;
        }
      }
    }
    throw new Error('All RPC providers failed');
  }

  /** Get (and lazily create) a WebSocket provider for event streaming */
  getWebSocketProvider(): WebSocketProvider | undefined {
    if (!config.websocketRpcUrl) return undefined;
    if (!this.wsProvider) {
      this.wsProvider = new WebSocketProvider(config.websocketRpcUrl);
    }
    return this.wsProvider;
  }
}

export const network = new NetworkManager();
