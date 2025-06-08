import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('pin-message')
  .setDescription('Pin a message to its channel by link')
  .addStringOption(option =>
    option
      .setName('message_link')
      .setDescription('Paste the full message link from Discord')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
  
export const meta = {
  example: '/pin-message message_link:"https://discord.com/channels/123/456/789"',
  output: '📌 Pinned [this message](...) in #channel-name.'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const messageLink = interaction.options.getString('message_link', true);

  // Expected format: https://discord.com/channels/<guild>/<channel>/<message>
  const match = messageLink.match(/\/channels\/(\d+)\/(\d+)\/(\d+)/);
  if (!match) {
    return interaction.reply({ content: '❌ Invalid message link format.', ephemeral: true });
  }

  const [, guildId, channelId, messageId] = match;
  if (guildId !== interaction.guildId) {
    return interaction.reply({ content: '❌ This message is from a different server.', ephemeral: true });
  }

  try {
    const channel = await interaction.guild!.channels.fetch(channelId) as TextChannel;
    const message = await channel.messages.fetch(messageId);
    await message.pin();

    await interaction.reply({ content: `📌 Pinned [this message](${messageLink}) in <#${channel.id}>.`, ephemeral: false });
  } catch (err) {
    console.error(err);
    return interaction.reply({ content: '❌ Failed to pin the message. Check the link and permissions.', ephemeral: true });
  }
}
