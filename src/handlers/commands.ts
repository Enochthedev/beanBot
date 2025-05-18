import { Client, Events, Interaction, ChatInputCommandInteraction } from 'discord.js';
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
    // ✅ Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = commandMap[interaction.commandName];
      if (!command) {
        console.warn(chalk.yellow(`⚠️  Unknown command: /${interaction.commandName}`));
        await interaction.reply({ content: 'Command not found.', ephemeral: true });
        return;
      }

      console.log(chalk.green(`📥 /${interaction.commandName} triggered by ${interaction.user.tag}`));
      try {
        await command.execute(interaction as ChatInputCommandInteraction);
        console.log(chalk.green(`✅ Successfully executed /${interaction.commandName}`));
      } catch (error) {
        console.error(chalk.red(`❌ Error in /${interaction.commandName}: ${error instanceof Error ? error.message : String(error)}`));
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: '❌ Something went wrong.' });
        } else {
          await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
        }
      }
      return;
    }

    // ✅ Button Interactions (toggle_role_X)
    if (interaction.isButton() && interaction.customId.startsWith('toggle_role_')) {
      const roleId = interaction.customId.replace('toggle_role_', '');
      const member = interaction.member;

      if (!member || !('roles' in member)) return;

      const role = interaction.guild?.roles.cache.get(roleId);
      if (!role) {
        return interaction.reply({ content: '❌ Role not found.', ephemeral: true });
      }

      const hasRole = Array.isArray(member.roles)
        ? member.roles.includes(roleId)
        : member.roles.cache.has(roleId);

      try {
        if (hasRole) {
          await (member.roles as import('discord.js').GuildMemberRoleManager).remove(roleId);
          await interaction.reply({ content: `❌ Removed **${role.name}** role.`, ephemeral: true });
        } else {
          await (member.roles as import("discord.js").GuildMemberRoleManager).add(roleId);
          await interaction.reply({ content: `✅ You now have the **${role.name}** role!`, ephemeral: true });
        }
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Failed to update role. Check bot permissions.', ephemeral: true });
      }
      return;
    }

    // ✅ Autocomplete for welcome-message templates (optional)
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused();
      if (interaction.commandName === 'welcome-message') {
        try {
          const { welcomeTemplates } = await import('@templates/welcome-templates'); // adjust if needed
          const filtered = Object.keys(welcomeTemplates).filter(k => k.includes(focused));
          await interaction.respond(filtered.map(k => ({ name: k, value: k })));
        } catch {
          await interaction.respond([]);
        }
      }
    }
  });
}