import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { createWalletSession } from '@modules/wallet';
import { prisma } from '@libs/prisma';

export const data = new SlashCommandBuilder()
  .setName('connect-wallet')
  .setDescription('Link your wallet by signing a challenge')
  .addStringOption(opt =>
    opt.setName('address')
      .setDescription('Your wallet address')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const address = interaction.options.getString('address', true);

  // Ensure user exists
  let user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: interaction.user.id,
        discordTag: interaction.user.tag,
      },
    });
  }

  // Create nonce session tied to this user + address
  const session = await createWalletSession(user.id, address);
  const message = `Please sign the following message in your wallet:\n${process.env.SIGNATURE_MESSAGE}:${session.nonce}`;

  // DM or ephemeral reply
  await interaction.reply({ content: message, ephemeral: true });
}
