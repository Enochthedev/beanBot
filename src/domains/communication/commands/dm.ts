import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('dm')
  .setDescription('Send a direct message to a user as the bot')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('User to DM')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('message')
      .setDescription('Message to send')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const message = interaction.options.getString('message', true);

  await user.send(message).catch(() => null);
  await interaction.reply({ content: `✅ DM sent to ${user.tag}!`, ephemeral: true });
}
