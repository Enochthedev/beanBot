import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';
import { getUserWallet } from '@modules/wallet';

export const data = new SlashCommandBuilder()
  .setName('wallet-info')
  .setDescription('Show your connected wallet');

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) return interaction.reply({ content: 'No wallet linked.', ephemeral: true });
  const wallet = await getUserWallet(user.id);
  if (!wallet) return interaction.reply({ content: 'No wallet linked.', ephemeral: true });
  await interaction.reply({ content: `Connected wallet: \`${wallet}\``, ephemeral: true });
}
