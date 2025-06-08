import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';

export const data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('View bot settings');

export async function execute(interaction: ChatInputCommandInteraction) {
  const settings = await prisma.botSettings.findFirst();
  if (!settings) return interaction.reply({ content: 'No settings configured.', ephemeral: true });
  await interaction.reply({ content: `Max concurrent mints: ${settings.maxConcurrentMints}\nQueue size: ${settings.maxQueueSize}`, ephemeral: true });
}
