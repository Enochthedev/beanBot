import { REST, Routes } from 'discord.js';
import { loadCommands } from '@interactions/registry/commands';
import { config } from '@config/index';
import chalk from 'chalk';

export async function deployCommands() {
  const commands = await loadCommands();
  const rest = new REST({ version: '10' }).setToken(config.botToken);

  try {
    const body = commands.map((c) => c.data.toJSON());
    const scope = config.useGlobalCommands ? chalk.magentaBright('global') : chalk.cyanBright(`guild (${config.guildId})`);
    console.log(`🌍 Using ${scope} commands...`);
    if (body.length === 0) {
      console.log(chalk.yellowBright('⚠️  No commands to deploy! Did you add any commands?'));
      return;
    }
    console.log(chalk.blue('📜 Commands to be deployed:'), chalk.bold(body.map(cmd => cmd.name).join(', ')));

    if (!config.useGlobalCommands && !config.guildId) {
      throw new Error('GUILD_ID must be set in .env or config to deploy guild commands');
    }

    await (config.useGlobalCommands
      ? rest.put(Routes.applicationCommands(config.clientId), { body })
      : rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId!), { body })
    );
    console.log(chalk.greenBright('✅ Commands deployed successfully!'));
  } catch (err) {
    console.error(chalk.red('❌ Failed to deploy commands:'), err instanceof Error ? err.message : err);
  }
}
