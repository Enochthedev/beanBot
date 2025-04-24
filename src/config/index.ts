import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  guildId: process.env.GUILD_ID,
  useGlobalCommands: process.env.GLOBAL_COMMANDS === 'true',
  webhookPort: parseInt(process.env.WEBHOOK_PORT ?? '5001', 10),
  version: '0.0.1'
};
