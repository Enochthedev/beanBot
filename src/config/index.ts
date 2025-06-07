import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  guildId: process.env.GUILD_ID,
  useGlobalCommands: process.env.GLOBAL_COMMANDS === 'true',
  webhookPort: parseInt(process.env.WEBHOOK_PORT ?? '5001', 10),
  version: '0.0.1',

  // Add other configuration options as needed
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

  // Redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
