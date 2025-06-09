import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { config } from '@config/index';
import { PaymentMethod } from '@prisma/client';

export const data = new SlashCommandBuilder()
  .setName('deactivate-payment-method')
  .setDescription('Disable a payment method')
  .addStringOption(opt =>
    opt.setName('method')
      .setDescription('Payment method')
      .setRequired(true)
      .addChoices(
        { name: 'ON_CHAIN', value: 'ON_CHAIN' },
        { name: 'PAYPAL', value: 'PAYPAL' },
        { name: 'OTHER', value: 'OTHER' }
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const method = interaction.options.getString('method', true) as PaymentMethod;

  if (!config.disabledPaymentMethods.includes(method)) {
    config.disabledPaymentMethods.push(method);
  }

  await interaction.reply({ content: `✅ ${method} disabled for new payments`, ephemeral: true });
}
