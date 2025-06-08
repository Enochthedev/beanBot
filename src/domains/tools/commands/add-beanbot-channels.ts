import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('add-beanbot-channels')
  .setDescription('Add Bean Bot Hub channels to the server (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const meta = {
  example: '/add-beanbot-channels',
  output: '✅ Bean Bot Hub channels created under `「 Bean Bot Hub 」`. Only "verified" users can view them.'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });
  if (!interaction.memberPermissions?.has('Administrator')) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  await interaction.reply({ content: '⏳ Creating Bean Bot Hub channels...', ephemeral: true });

  const everyoneRole = guild.roles.everyone;
  const verifiedRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');
  if (!verifiedRole) {
    return interaction.editReply({ content: '❌ "Verified" role not found.' });
  }

  const beanBotChannels = [
    '🎰-bridge-raffles',
    '🗓️-daily-mint',
    '🏆-raffle-winners',
    '🎁-airdrops',
    '🧠-early-nft-alpha',
    '✅-airdrop-checker',
    '📣-ayodeji-calls',
    '🎮-gaming',
  ];

  const category = await guild.channels.create({
    name: '「 Bean Bot Hub 」',
    type: ChannelType.GuildCategory,
  });

  for (const name of beanBotChannels) {
    await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: verifiedRole.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });
  }

  await interaction.editReply({ content: `✅ Bean Bot Hub channels created!` });
}
