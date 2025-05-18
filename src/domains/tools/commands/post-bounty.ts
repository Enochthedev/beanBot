import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('post-bounty')
  .setDescription('Post a bounty for contributors')
  .addSubcommand(sub =>
    sub.setName('single')
      .setDescription('Post a single bounty')
      .addStringOption(opt =>
        opt.setName('title').setDescription('Bounty title').setRequired(true))
      .addStringOption(opt =>
        opt.setName('reward').setDescription('Reward (e.g. 100 USDC)').setRequired(true))
      .addStringOption(opt =>
        opt.setName('description').setDescription('What the bounty requires').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('mass')
      .setDescription('Post multiple bounties')
      .addAttachmentOption(opt =>
        opt.setName('file').setDescription('Upload a CSV file with bounties').setRequired(true))
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'single') {
    const title = interaction.options.getString('title', true);
    const reward = interaction.options.getString('reward', true);
    const description = interaction.options.getString('description', true);

    await interaction.reply({
      content: `💰 **Bounty Posted:**\n**${title}**\nReward: ${reward}\n${description}`,
    });
  } else if (sub === 'mass') {
    const file = interaction.options.getAttachment('file', true);
    await interaction.reply({
      content: `📥 Processing bounty file: ${file.name} (Mass bounty posting coming soon)`,
      ephemeral: true,
    });
  }
}