import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { checkUserAccess, validateMintEligibility, MintQueue, AccessLevel } from '@modules/mint';

const queue = new MintQueue(5);

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
  const walletAddress = '0x0000000000000000000000000000000000000000'; // placeholder
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
