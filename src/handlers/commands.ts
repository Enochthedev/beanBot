import { Client, Events, ChatInputCommandInteraction, Interaction } from 'discord.js';
import { loadCommands } from '@interactions/registry/commands';
import type { SlashCommand } from '@interactions/shared';
import chalk from 'chalk';

export async function registerCommandHandler(client: Client) {
  const commands = await loadCommands();
  const commandMap: Record<string, SlashCommand> = {};
  for (const cmd of commands) {
    commandMap[cmd.data.name] = cmd;
  }

  console.log(chalk.cyan('💡 Slash command handler initialized. Ready for interactions.'));

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commandMap[interaction.commandName];
    if (!command) {
      console.warn(
        chalk.yellow(`⚠️  Unknown command: /${chalk.bold(interaction.commandName)}`)
      );
      await interaction.reply({ content: 'Command not found.', ephemeral: true });
      return;
    }
    console.log(
      chalk.green(
        `📥 /${chalk.bold(interaction.commandName)} triggered by ${chalk.magentaBright(interaction.user.tag)} (${interaction.user.id})`
      )
    );
    try {
      await command.execute(interaction as ChatInputCommandInteraction);
      console.log(
        chalk.green(
          `✅ Successfully executed /${interaction.commandName} for ${chalk.magentaBright(interaction.user.tag)}`
        )
      );
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Error in /${interaction.commandName}: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: '❌ Something went wrong.' });
      } else {
        await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
      }
    }
  });
}
