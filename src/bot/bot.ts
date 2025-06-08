import { client } from '@bot/client';
import { config } from '@config/index';
import { registerCommandHandler } from '@handlers/commands';
import { registerMessageHandlers } from '@handlers/messages/register-message-handlers';
import { deployCommands } from '@bot/deploy';
import { blockStreamer } from '@modules/network';
import chalk from 'chalk';

console.log(chalk.cyanBright('🚀 Starting Discord bot...'));

client.once('ready', async () => {
  console.log(chalk.blueBright('🔄 Initializing handlers and deploying commands...'));

  await registerCommandHandler(client);
  await registerMessageHandlers(client);
  await deployCommands();

  blockStreamer.start();

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

console.log(chalk.cyan('🤖 Bot is running...'));
