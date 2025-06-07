import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  guildId: process.env.GUILD_ID,
  useGlobalCommands: process.env.GLOBAL_COMMANDS === 'true',
  webhookPort: parseInt(process.env.WEBHOOK_PORT ?? '5001', 10),
  version: '0.0.1',
  rpcUrls: [
    process.env.PRIMARY_RPC_URL!,
    process.env.SECONDARY_RPC_URL!,
    process.env.TERTIARY_RPC_URL!
  ].filter(Boolean),
  websocketRpcUrl: process.env.WEBSOCKET_RPC_URL,
  chainId: parseInt(process.env.CHAIN_ID ?? '1', 10),
  maxConcurrentMints: parseInt(process.env.MAX_CONCURRENT_MINTS ?? '50', 10),
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE ?? '1000', 10),
  minBalanceBufferEth: parseFloat(process.env.MIN_BALANCE_BUFFER_ETH ?? '0.1'),
  gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER ?? '1.2')
};
