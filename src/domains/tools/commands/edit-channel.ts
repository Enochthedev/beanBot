import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('edit-channel')
  .setDescription('Edit a text channel\'s name, topic, or category')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Channel to edit')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('new_name')
      .setDescription('New name for the channel (optional)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('topic')
      .setDescription('New channel topic/description (optional)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('new_category')
      .setDescription('New category to move the channel into (optional)')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export const meta = {
  example: '/edit-channel channel:#bounties new_name:"early-alpha" topic:"Latest mints + leaks" new_category:"Opportunities"',
  output: '✅ Channel updated successfully.'
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });

  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const newName = interaction.options.getString('new_name');
  const newTopic = interaction.options.getString('topic');
  const newCategoryName = interaction.options.getString('new_category');

  const updates: any = {};

  if (newName) updates.name = newName.toLowerCase().replace(/\s+/g, '-');
  if (newTopic) updates.topic = newTopic;

  if (newCategoryName) {
    const category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === newCategoryName.toLowerCase()
    );
    if (!category) {
      return interaction.reply({ content: `❌ Category "${newCategoryName}" not found.`, ephemeral: true });
    }
    updates.parent = category.id;
  }

  try {
    await channel.edit(updates);
    await interaction.reply({ content: `✅ Channel updated successfully.`, ephemeral: false });
  } catch (err) {
    console.error(err);
    return interaction.reply({ content: '❌ Failed to update the channel. Check bot permissions.', ephemeral: true });
  }
}
