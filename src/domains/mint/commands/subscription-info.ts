import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';

export const data = new SlashCommandBuilder()
  .setName('subscription-info')
  .setDescription('Show your subscription status');

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) return interaction.reply({ content: 'No subscription.', ephemeral: true });
  const sub = await prisma.subscription.findFirst({ where: { userId: user.id, isActive: true } });
  if (!sub) return interaction.reply({ content: 'No active subscription.', ephemeral: true });
  const expires = sub.expiresAt ? sub.expiresAt.toISOString().split('T')[0] : 'never';
  await interaction.reply({ content: `Type: ${sub.subscriptionType}\nRemaining mints: ${sub.mintsRemaining}\nExpires: ${expires}`, ephemeral: true });
}
