import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Discord Bot Configuration
  botToken: process.env.BOT_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  useGlobalCommands: process.env.GLOBAL_COMMANDS === 'true',
  webhookPort: parseInt(process.env.WEBHOOK_PORT ?? '5001', 10),
  version: '0.0.1',

  // Blockchain Configuration
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
  gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER ?? '1.2'),
  mintMaxRetries: parseInt(process.env.MINT_MAX_RETRIES ?? '2', 10),

  // Twitter API Configuration
  twitterClientId: process.env.TWITTER_CLIENT_ID!,
  twitterClientSecret: process.env.TWITTER_CLIENT_SECRET!,
  twitterRedirectUri: process.env.TWITTER_REDIRECT_URI!,
  twitterScopes: [
    'tweet.read',
    'tweet.write',
    'users.read',
    'offline.access'
  ],
  twitterApiBaseUrl: 'https://api.twitter.com/2',
  twitterAuthUrl: 'https://twitter.com/i/oauth2/authorize',
  twitterTokenUrl: 'https://api.twitter.com/2/oauth2/token',

  // Redis Configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Payment configuration
  paymentReceiverAddresses: (process.env.PAYMENT_RECEIVER_ADDRESSES ?? '').split(',').map(a => a.trim()).filter(Boolean),
};
