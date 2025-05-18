import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('join-bounty')
  .setDescription('Join a bounty as a contributor')
  .addSubcommand(sub =>
    sub.setName('single')
      .setDescription('Join a single bounty')
      .addStringOption(opt =>
        opt.setName('bounty_id').setDescription('ID of the bounty to join').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('mass')
      .setDescription('Join multiple bounties')
      .addStringOption(opt =>
        opt.setName('bounty_ids').setDescription('Comma-separated bounty IDs').setRequired(true))
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'single') {
    const bountyId = interaction.options.getString('bounty_id', true);
    await interaction.reply({
      content: `✅ You have joined bounty \`${bountyId}\`. Good luck!`,
      ephemeral: true,
    });
  } else if (sub === 'mass') {
    const bountyIds = interaction.options.getString('bounty_ids', true).split(',').map(id => id.trim());
    await interaction.reply({
      content: `✅ You have joined ${bountyIds.length} bounties: \`${bountyIds.join(', ')}\``,
      ephemeral: true,
    });
  }
}