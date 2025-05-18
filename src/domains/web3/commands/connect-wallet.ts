import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('connect-wallet')
  .setDescription('[Demo] Simulate a wallet connection')
  .addStringOption(opt =>
    opt.setName('address')
      .setDescription('Your wallet address')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const address = interaction.options.getString('address', true);
  await interaction.reply({
    content: `🔗 Wallet \`${address.slice(0, 6)}...${address.slice(-4)}\` connected (demo only).`,
    ephemeral: true,
  });
}