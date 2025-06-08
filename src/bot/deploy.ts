import { REST, Routes } from 'discord.js';
import { loadCommands } from '@interactions/registry/commands';
import { config } from '@config/index';
import chalk from 'chalk';

export async function deployCommands() {
  const commands = await loadCommands();
  const rest = new REST({ version: '10' }).setToken(config.botToken);

  try {
    const body = commands.map((c) => c.data.toJSON());
    console.log(chalk.magentaBright('🌍 Using global commands...'));

    if (body.length === 0) {
      console.log(chalk.yellowBright('⚠️  No commands to deploy! Did you add any commands?'));
      return;
    }
    console.log(chalk.blue('📜 Commands to be deployed:'), chalk.bold(body.map(cmd => cmd.name).join(', ')));

    await rest.put(Routes.applicationCommands(config.clientId), { body });

    console.log(chalk.greenBright('✅ Commands deployed successfully!'));
    console.log(chalk.yellowBright('⚠️  Note: Global commands can take up to 1 hour to propagate to all servers!'));
  } catch (err) {
    console.error(chalk.red('❌ Failed to deploy commands:'), err instanceof Error ? err.message : err);
  }
}
