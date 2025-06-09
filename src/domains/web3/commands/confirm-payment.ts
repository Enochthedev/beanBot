import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType
} from 'discord.js';
import { prisma } from '@libs/prisma';
import { updatePaymentStatus } from '@modules/payment';
import { network } from '@modules/network';
import { PaymentStatus } from '@prisma/client';

export const data = new SlashCommandBuilder()
  .setName('confirm-payment')
  .setDescription('Confirm your payment by providing a transaction hash')
  .addStringOption(opt =>
    opt.setName('txhash')
      .setDescription('Transaction hash')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const txHash = interaction.options.getString('txhash', true).trim();
  if (!/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
    return interaction.reply({ content: '❌ Invalid transaction hash.', ephemeral: true });
  }

  const payment = await prisma.payment.findFirst({
    where: { channelId: interaction.channelId, status: PaymentStatus.PENDING }
  });

  if (!payment) {
    return interaction.reply({ content: '❌ Payment not found for this channel.', ephemeral: true });
  }

  try {
    await network.withProvider(p => p.waitForTransaction(txHash));
    const tx = await network.withProvider(p => p.getTransaction(txHash));
    if (!tx || (payment.walletAddress && tx.to?.toLowerCase() !== payment.walletAddress.toLowerCase())) {
      return interaction.reply({ content: '❌ Transaction does not match payment.', ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    return interaction.reply({ content: '❌ Unable to verify transaction.', ephemeral: true });
  }

  await updatePaymentStatus(payment.id, PaymentStatus.COMPLETED, txHash);
  await interaction.reply({ content: '✅ Payment confirmed. Closing ticket...', ephemeral: true });

  if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
    await interaction.channel.delete().catch(() => {});
  }
}
