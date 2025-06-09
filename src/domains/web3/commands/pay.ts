import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType
} from 'discord.js';
import { prisma } from '@libs/prisma';
import { createPayment } from '@modules/payment';
import { PaymentCurrency, PaymentMethod } from '@prisma/client';

export const data = new SlashCommandBuilder()
  .setName('pay')
  .setDescription('Start a service payment')
  .addStringOption(opt =>
    opt.setName('service')
      .setDescription('Service name')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('currency')
      .setDescription('Payment currency')
      .addChoices(
        { name: 'USDT', value: 'USDT' },
        { name: 'USDC', value: 'USDC' }
      )
      .setRequired(true)
  );

export const meta = {
  example: '/pay service:sniper currency:USDT',
  output: '✅ Payment ticket created'
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const serviceName = interaction.options.getString('service', true).toLowerCase();
  const currency = interaction.options.getString('currency', true) as PaymentCurrency;

  const service = await prisma.servicePrice.findUnique({ where: { name: serviceName } });
  if (!service) {
    await interaction.reply({ content: '❌ Unknown service.', ephemeral: true });
    return;
  }
  const amount = service.price;

  let user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    user = await prisma.user.create({ data: { discordId: interaction.user.id, discordTag: interaction.user.tag } });
  }

  let payment;
  try {
    payment = await createPayment(
      user.id,
      service.id,
      amount,
      currency,
      PaymentMethod.ON_CHAIN
    );
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Payment receiver address not configured.', ephemeral: true });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Must be used inside a server.', ephemeral: true });
    return;
  }

  const channel = await interaction.guild.channels.create({
    name: `payment-${interaction.user.username}-${payment.id.slice(0,4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.guild.ownerId, allow: [PermissionFlagsBits.ViewChannel], type: OverwriteType.Member }
    ]
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { channelId: channel.id } });

  await channel.send(`Please send **${amount} ${currency}** to \`${payment.walletAddress}\` for **${service.name}** and then run /confirm-payment txhash:<hash>`);

  await interaction.reply({ content: `✅ Payment ticket created: ${channel}`, ephemeral: true });
}
