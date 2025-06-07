import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { cache } from '@/lib/cache';

export const data = new SlashCommandBuilder()
  .setName('set-modlog')
  .setDescription('Set the channel for moderation logs')
  .addChannelOption(opt =>
    opt.setName('channel').setDescription('Channel').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true);
  await cache.set('mod:log', channel.id);
  await interaction.reply({ content: `✅ Mod log channel set to <#${channel.id}>`, ephemeral: true });
}
