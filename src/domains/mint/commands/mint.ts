import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { checkUserAccess, validateMintEligibility, globalMintQueue, AccessLevel } from '@modules/mint';
import { prisma } from '@libs/prisma';
import { getUserWallet } from '@modules/wallet';

const queue = globalMintQueue;

export const data = new SlashCommandBuilder()
  .setName('mint')
  .setDescription('Queue a mint request')
  .addStringOption(opt =>
    opt.setName('project')
      .setDescription('Project ID')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Mint amount')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const projectId = interaction.options.getString('project', true);
  const amount = interaction.options.getInteger('amount', true);

  const access = await checkUserAccess(interaction.user.id);
  if (access === AccessLevel.NONE) {
    return interaction.reply({ content: '❌ You do not have access to mint.', ephemeral: true });
  }

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    return interaction.reply({ content: '❌ No wallet linked. Use /connect-wallet first.', ephemeral: true });
  }

  const walletAddress = await getUserWallet(user.id);
  if (!walletAddress) {
    return interaction.reply({ content: '❌ No wallet linked. Use /connect-wallet first.', ephemeral: true });
  }

  const validation = await validateMintEligibility(walletAddress, projectId, amount);
  if (!validation.ok) {
    return interaction.reply({ content: `❌ ${validation.message}`, ephemeral: true });
  }

  queue.add({
    userId: interaction.user.id,
    projectId,
    walletAddress,
    amount,
    priority: access === AccessLevel.PREMIUM ? 'premium' : 'basic'
  });

  queue.processNext();
  await interaction.reply({ content: '✅ Mint queued!', ephemeral: true });
}