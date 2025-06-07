import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { randomBytes } from 'crypto';
import { cache } from '@/lib/cache';

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
  const nonce = 'beanbot-' + randomBytes(8).toString('hex');
  await cache.set(`wallet_nonce:${interaction.user.id}`, { address, nonce }, { ttl: 600 });
  await interaction.reply({
    content: `Sign the text \`${nonce}\` with **${address}** and run /confirm-wallet signature:<signature>`,
    ephemeral: true,
  });
}
