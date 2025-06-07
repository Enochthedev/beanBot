import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { cache } from '@/lib/cache';
import { ethers } from 'ethers';

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
  const pending = await cache.get<{ address: string; nonce: string }>(`wallet_nonce:${interaction.user.id}`);
  if (!pending) return interaction.reply({ content: '❌ No pending wallet connection.', ephemeral: true });
  try {
    const signer = ethers.verifyMessage(pending.nonce, signature);
    if (signer.toLowerCase() !== pending.address.toLowerCase()) throw new Error('Address mismatch');
    await cache.set(`wallet:${interaction.user.id}`, pending.address);
    await cache.del(`wallet_nonce:${interaction.user.id}`);
    await interaction.reply({ content: `✅ Wallet ${pending.address} connected!`, ephemeral: true });
  } catch (err) {
    await interaction.reply({ content: '❌ Invalid signature.', ephemeral: true });
  }
}
