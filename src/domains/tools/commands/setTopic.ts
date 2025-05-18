import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('set-topic')
  .setDescription('Set a new topic for a text channel')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('The channel to set the topic for')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('topic')
      .setDescription('New topic content')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel');
  const topic = interaction.options.getString('topic');

  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const hasRole = member?.roles.cache.some(r => ['team'].includes(r.name.toLowerCase()));

  if (
    !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
    !hasRole
  ) {
    return interaction.reply({ content: '❌ Only Admins or Team can use this.', ephemeral: true });
  }

  if (!channel || channel.type !== ChannelType.GuildText) {
    return interaction.reply({ content: '❌ Please select a valid text channel.', ephemeral: true });
  }

  try {
    // @ts-ignore
    await channel.setTopic(topic!);
    await interaction.reply({
      content: `✅ Topic for <#${channel.id}> set to:\n> ${topic}`,
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: '❌ Failed to set topic. Do I have permission?',
      ephemeral: true,
    });
  }
}