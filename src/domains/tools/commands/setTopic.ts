import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  ChannelType 
} from 'discord.js';

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel');
  const topic = interaction.options.getString('topic');

  // Check if user is admin OR has "team" or "OG" role
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const hasRole = member?.roles.cache.some(
    r => ['team'].includes(r.name.toLowerCase())
  );
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
    // @ts-ignore (discord.js types issue, but works at runtime)
    await channel.setTopic(topic!);
    await interaction.reply({ content: `✅ Topic for <#${channel.id}> set to:\n> ${topic}`, ephemeral: true });
  } catch (error) {
    await interaction.reply({ content: '❌ Failed to set topic. Do I have permission?', ephemeral: true });
  }
}