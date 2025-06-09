import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '@libs/prisma';
import { PaymentCurrency } from '@prisma/client';

export const data = new SlashCommandBuilder()
  .setName('set-service-price')
  .setDescription('Configure the price for a paid service')
  .addStringOption(opt =>
    opt.setName('service')
      .setDescription('Service name')
      .setRequired(true)
  )
  .addNumberOption(opt =>
    opt.setName('price')
      .setDescription('Price amount')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('currency')
      .setDescription('Payment currency')
      .addChoices({ name: 'USDT', value: 'USDT' }, { name: 'USDC', value: 'USDC' })
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('service', true).toLowerCase();
  const price = interaction.options.getNumber('price', true);
  const currency = interaction.options.getString('currency', true) as PaymentCurrency;

  await prisma.servicePrice.upsert({
    where: { name },
    create: { name, price: String(price), currency },
    update: { price: String(price), currency }
  });

  await interaction.reply({ content: `✅ Price for ${name} set to ${price} ${currency}`, ephemeral: true });
}
