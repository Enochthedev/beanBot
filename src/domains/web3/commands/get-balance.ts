import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ethers } from 'ethers';

export const data = new SlashCommandBuilder()
  .setName('get-balance')
  .setDescription('Check ETH balance of an address')
  .addStringOption(opt =>
    opt.setName('address').setDescription('Ethereum address').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const address = interaction.options.getString('address', true);
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://eth.llamarpc.com');
    const bal = await provider.getBalance(address);
    await interaction.reply({
      content: `Balance of ${address.slice(0, 6)}...: ${ethers.formatEther(bal)} ETH`,
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Failed to fetch balance', ephemeral: true });
  }
}
