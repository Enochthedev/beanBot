import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { cache } from '@/lib/cache';

export const data = new SlashCommandBuilder()
  .setName('welcome-channel')
  .setDescription('Set the channel for join greetings')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Channel for welcome messages')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true);
  await cache.set('welcome:channel', channel.id);
  await interaction.reply({ content: `✅ Welcome channel set to <#${channel.id}>`, ephemeral: true });
}
