import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@libs/prisma';
import { verifyWalletSignature } from '@modules/wallet';

export const data = new SlashCommandBuilder()
  .setName('confirm-wallet')
  .setDescription('Confirm your wallet connection')
  .addStringOption(opt =>
    opt.setName('signature')
      .setDescription('Signature from /connect-wallet')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const signature = interaction.options.getString('signature', true);

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    return interaction.reply({ content: '❌ No pending wallet connection.', ephemeral: true });
  }

  const session = await prisma.walletSession.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    return interaction.reply({ content: '❌ No pending wallet connection.', ephemeral: true });
  }

  const verified = await verifyWalletSignature(session.id, signature);

  if (!verified) {
    await interaction.reply({ content: '❌ Invalid signature.', ephemeral: true });
  } else {
    await interaction.reply({ content: `✅ Wallet ${session.walletAddress} connected!`, ephemeral: true });
  }
}
