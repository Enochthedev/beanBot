import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('welcome-message')
  .setDescription('Send and pin a permanent welcome message to a channel')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Where to post the welcome message')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('message')
      .setDescription('The welcome message content (Markdown supported)')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const message = interaction.options.getString('message', true);

  if (!channel?.isTextBased()) {
    return interaction.reply({ content: '❌ Please select a valid text channel.', ephemeral: true });
  }

  try {
    const sent = await channel.send(message);
    await sent.pin(); // Optional pin
    await interaction.reply({
      content: `✅ Welcome message sent to <#${channel.id}> and pinned.`,
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Failed to send the welcome message.', ephemeral: true });
  }
}