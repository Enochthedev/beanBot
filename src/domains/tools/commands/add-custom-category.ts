// tools/add-custom-category.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('add-custom-category')
  .setDescription('Create a category and optional text channels with role visibility control')
  .addStringOption(opt =>
    opt.setName('category')
      .setDescription('Name of the category (e.g. Alpha Hub)')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('allow_roles')
      .setDescription('Comma-separated list of roles that should see the category')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('channels')
      .setDescription('Comma-separated list of channels (e.g. alpha-news, drops, chat)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('deny_roles')
      .setDescription('Comma-separated list of roles to hide the category from')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const meta = {
  example: '/add-custom-category category:"Alpha Hub" allow_roles:"verified,team" channels:"alpha-news,drops,chat"',
  output: '✅ Created **Alpha Hub** with 3 channels. Only specified roles can view it.'
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });
  }

  const member = await guild.members.fetch(interaction.user.id);
  const hasAccess = member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some(r => ['team', 'mod'].includes(r.name.toLowerCase()));

  if (!hasAccess) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const categoryName = interaction.options.getString('category', true);
  const channelsRaw = interaction.options.getString('channels');
  const allowRolesRaw = interaction.options.getString('allow_roles', true);
  const denyRolesRaw = interaction.options.getString('deny_roles') ?? '';

  const channelNames = channelsRaw
    ? channelsRaw.split(',').map(c => c.trim().toLowerCase().replace(/\s+/g, '-'))
    : [];
  const allowRoleNames = allowRolesRaw.split(',').map(r => r.trim().toLowerCase());
  const denyRoleNames = denyRolesRaw.split(',').map(r => r.trim().toLowerCase());

  const existingCategory = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase() === `「 ${categoryName.toLowerCase()} 」`
  );

  if (existingCategory) {
    return interaction.reply({ content: `⚠️ A category named **${categoryName}** already exists.`, ephemeral: true });
  }

  await interaction.reply({ content: `⏳ Creating category **${categoryName}**...`, ephemeral: true });

  const allowRoles = guild.roles.cache.filter(r => allowRoleNames.includes(r.name.toLowerCase()));
  const denyRoles = guild.roles.cache.filter(r => denyRoleNames.includes(r.name.toLowerCase()));

  const permissionOverwrites = [
    ...allowRoles.map(role => ({ id: role.id, allow: [PermissionFlagsBits.ViewChannel] })),
    ...denyRoles.map(role => ({ id: role.id, deny: [PermissionFlagsBits.ViewChannel] })),
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
  ];

  const category = await guild.channels.create({
    name: `「 ${categoryName} 」`,
    type: ChannelType.GuildCategory,
    permissionOverwrites,
  });

  for (const chName of channelNames) {
    await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites,
    });
  }

  await interaction.editReply({
    content: `✅ Created **${categoryName}** with ${channelNames.length} ${channelNames.length === 1 ? 'channel' : 'channels'}.`,
  });
}