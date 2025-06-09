import { client } from '@bot/client';
import { config } from '@config/index';
import { registerCommandHandler } from '@handlers/commands';
import { registerMessageHandlers } from '@handlers/messages/register-message-handlers';
import { deployCommands } from '@bot/deploy';
import { blockStreamer } from '@modules/network';
import { startDetectionWatcher, detectionEvents } from '@modules/detection';
import { initMetrics } from '@modules/metrics';
import { globalMintQueue } from '@modules/mint';
import { prisma } from '@libs/prisma';
import chalk from 'chalk';

console.log(chalk.cyanBright('🚀 Starting Discord bot...'));

client.once('ready', async () => {
  console.log(chalk.blueBright('🔄 Initializing handlers and deploying commands...'));

  await registerCommandHandler(client);
  await registerMessageHandlers(client);
  await deployCommands();

  // Ensure guild configs exist for all current servers
  for (const guild of client.guilds.cache.values()) {
    await prisma.guildConfig.upsert({
      where: { guildId: guild.id },
      update: {},
      create: { guildId: guild.id }
    });
  }

  blockStreamer.start();
  startDetectionWatcher();
  initMetrics(globalMintQueue);
  detectionEvents.on('opportunity', () => globalMintQueue.processNext());

  console.log(
    chalk.greenBright(
      '\n🤖 Logged in as ' + chalk.bold(client.user?.tag ?? 'Unknown') + '\n' +
      '💻 Client ID: ' + chalk.bold(client.user?.id ?? 'Unknown') + '\n' +
      '🌐 Version: ' + chalk.bold(config.version) + '\n'
    )
  );
});

console.log(chalk.yellowBright('⚠️  Note: Global commands can take up to 1 hour to propagate to all servers!'));
console.log(chalk.yellowBright('⚠️  Make sure to set the bot token in your .env file!'));
client.login(config.botToken);

client.on('guildCreate', async guild => {
  try {
    await prisma.guildConfig.upsert({
      where: { guildId: guild.id },
      update: {},
      create: { guildId: guild.id }
    });
    console.log(chalk.green(`📥 Joined guild: ${guild.name}`));
  } catch (err) {
    console.error('Failed to create guild config:', err);
  }
});

client.on('guildDelete', async guild => {
  try {
    await prisma.guildConfig.delete({ where: { guildId: guild.id } });
    console.log(chalk.yellow(`📤 Removed from guild: ${guild.id}`));
  } catch (err) {
    console.error('Failed to remove guild config:', err);
  }
});

console.log(chalk.cyan('🤖 Bot is running...'));
