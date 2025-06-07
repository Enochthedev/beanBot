import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';

export const data = new SlashCommandBuilder()
  .setName('mint-status')
  .setDescription('Check your last mint attempt status');

export async function execute(interaction: ChatInputCommandInteraction) {
  const attempt = await prisma.mintAttempt.findFirst({
    where: { userId: interaction.user.id },
    orderBy: { createdAt: 'desc' }
  });
  if (!attempt) return interaction.reply({ content: 'No mint attempts found.', ephemeral: true });
  await interaction.reply({ content: `Last attempt status: ${attempt.status}`, ephemeral: true });
}
