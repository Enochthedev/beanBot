import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('add-custom-category')
  .setDescription('Create a new category and channels (Admin or Custom Role only)')
  .addStringOption(opt =>
    opt.setName('category')
      .setDescription('Name of the category (e.g. Alpha Hub)')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('channels')
      .setDescription('Comma-separated list of channels (e.g. alpha-news, drops, chat)')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });

  const member = await guild.members.fetch(interaction.user.id);
  const hasAccess = member.permissions.has(PermissionFlagsBits.Administrator) ||
                    member.roles.cache.some(r => ['team', 'mod'].includes(r.name.toLowerCase()));

  if (!hasAccess) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const categoryName = interaction.options.getString('category', true);
  const channelsRaw = interaction.options.getString('channels', true);
  const channelNames = channelsRaw.split(',').map(c => c.trim().toLowerCase().replace(/\s+/g, '-'));

  await interaction.reply({ content: `⏳ Creating category **${categoryName}** with channels...`, ephemeral: true });

  const category = await guild.channels.create({
    name: `「 ${categoryName} 」`,
    type: ChannelType.GuildCategory,
  });

  for (const chName of channelNames) {
    await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: category.id,
    });
  }

  await interaction.editReply({ content: `✅ Created **${categoryName}** with ${channelNames.length} channels.` });
}