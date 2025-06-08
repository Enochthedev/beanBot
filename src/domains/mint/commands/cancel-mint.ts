import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';
import { MintStatus } from '@prisma/client';

export const data = new SlashCommandBuilder()
  .setName('cancel-mint')
  .setDescription('Cancel a queued mint request')
  .addStringOption(opt =>
    opt.setName('project')
      .setDescription('Project ID')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const projectId = interaction.options.getString('project', true);
  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) return interaction.reply({ content: 'No queued mint found.', ephemeral: true });
  await prisma.mintAttempt.updateMany({
    where: { userId: user.id, projectId, status: { in: [MintStatus.PENDING, MintStatus.QUEUED, MintStatus.PROCESSING] } },
    data: { status: MintStatus.CANCELLED }
  });
  await interaction.reply({ content: 'Cancelled mint request if it existed.', ephemeral: true });
}
