import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { cache } from '@/lib/cache';

export const data = new SlashCommandBuilder()
  .setName('restrict-command')
  .setDescription('Restrict a slash command to a specific channel')
  .addStringOption(opt =>
    opt.setName('command').setDescription('Command name, e.g. ping').setRequired(true)
  )
  .addChannelOption(opt =>
    opt.setName('channel').setDescription('Allowed channel').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const cmd = interaction.options.getString('command', true).toLowerCase();
  const channel = interaction.options.getChannel('channel', true);
  await cache.set(`cmd:channel:${cmd}`, channel.id);
  await interaction.reply({
    content: `✅ \`/${cmd}\` can now only be used in <#${channel.id}>`,
    ephemeral: true,
  });
}
