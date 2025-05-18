// tools/admin-update.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { loadCommands } from '@interactions/registry/commands';
import type { SlashCommand } from '@interactions/shared';

export const data = new SlashCommandBuilder()
  .setName('admin-update')
  .setDescription('Update the admin info guide with all available commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const channel = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText && ch.name === 'bean-bot-admin-info'
  ) as TextChannel | undefined;

  if (!channel) {
    return interaction.reply({
      content: '❌ Could not find the `bean-bot-admin-info` channel. Run `/admin-info` first.',
      ephemeral: true,
    });
  }

  const commands: SlashCommand[] = await loadCommands();

  const lines: string[] = [];

  lines.push('👋 **Welcome to the Bean Bot Admin Guide**\n');
  lines.push('This channel is only visible to admins, mods, and the server owner.\n');
  lines.push('Here’s how to manage Bean Bot effectively:\n\n---\n');

  for (const cmd of commands) {
    const name = `/${cmd.data.name}`;
    const desc = cmd.data.description;
    const example = cmd.meta?.example ? `\n> Usage: \`${cmd.meta.example}\`` : '';
    lines.push(`• \`${name}\` — ${desc}${example}\n`);
  }

  lines.push('\n---\nNeed help? Ping the Bean team or check https://beanbot.xyz/support');

  const guideContent = lines.join('\n');

  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const existing = messages.find(msg =>
      msg.content.startsWith('👋 **Welcome to the Bean Bot Admin Guide**')
    );

    if (existing) {
      await existing.edit(guideContent);
      return interaction.reply({ content: '✅ Admin guide message updated.', ephemeral: true });
    } else {
      await channel.send({ content: guideContent });
      return interaction.reply({ content: '📌 Posted new admin guide message.', ephemeral: true });
    }
  } catch (err) {
    console.error('Error updating admin guide:', err);
    return interaction.reply({ content: '❌ Failed to update the admin guide.', ephemeral: true });
  }
}