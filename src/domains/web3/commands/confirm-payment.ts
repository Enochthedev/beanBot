import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType
} from 'discord.js';
import { prisma } from '@libs/prisma';
import { updatePaymentStatus } from '@modules/payment';
import { network } from '@modules/network';
import { PaymentStatus, PaymentCurrency } from '@prisma/client';
import { config } from '@config/index';
import { Interface, formatUnits } from 'ethers';

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
    if (!tx) {
      return interaction.reply({ content: '❌ Unable to fetch transaction.', ephemeral: true });
    }

    const expectedToken = payment.currency === PaymentCurrency.USDT
      ? config.usdtAddress.toLowerCase()
      : payment.currency === PaymentCurrency.USDC
        ? config.usdcAddress.toLowerCase()
        : '';

    if (!expectedToken || tx.to?.toLowerCase() !== expectedToken) {
      return interaction.reply({ content: '❌ Transaction does not match payment.', ephemeral: true });
    }

    const iface = new Interface(['function transfer(address to, uint256 value)']);
    let to: string;
    let value: bigint;
    try {
      ({ 0: to, 1: value } = iface.decodeFunctionData('transfer', tx.data));
    } catch {
      return interaction.reply({ content: '❌ Invalid transaction data.', ephemeral: true });
    }

    const amount = formatUnits(value, 6).replace(/\.0+$/, '');

    if (to.toLowerCase() !== payment.walletAddress?.toLowerCase() || amount !== payment.amount) {
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
