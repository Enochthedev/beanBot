import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Send a message as the bot to a chosen channel')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Channel to send the message')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('message')
      .setDescription('Message to send')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const message = interaction.options.getString('message', true);

  await channel.send(message);
  await interaction.reply({ content: `✅ Message sent to ${channel}!`, ephemeral: true });
}