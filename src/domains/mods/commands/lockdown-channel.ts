import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lockdown-channel')
  .setDescription('Lock or unlock a text channel for @everyone (Admin/Mod only)')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('The channel to lock/unlock')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('lock')
      .setDescription('Lock (true) or unlock (false) the channel')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const lock = interaction.options.getBoolean('lock', true);

  const everyoneRole = guild.roles.everyone;

  await interaction.reply({ content: `${lock ? '🔒 Locking' : '🔓 Unlocking'} <#${channel.id}>...`, ephemeral: true });

  await channel.permissionOverwrites.edit(everyoneRole, {
    SendMessages: lock ? false : null, // `null` resets to default
  });

  await interaction.followUp({
    content: `${lock ? '✅ Channel is now read-only.' : '✅ Channel is now unlocked for chat.'}`,
    ephemeral: false,
  });
}
