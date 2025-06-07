import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';

export const data = new SlashCommandBuilder()
  .setName('projects')
  .setDescription('List active mint projects');

export async function execute(interaction: ChatInputCommandInteraction) {
  const projects = await prisma.mintProject.findMany({ where: { isActive: true } });
  if (projects.length === 0) return interaction.reply({ content: 'No active projects.', ephemeral: true });
  const list = projects.map(p => `• **${p.name}** (${p.id})`).join('\n');
  await interaction.reply({ content: list, ephemeral: true });
}
