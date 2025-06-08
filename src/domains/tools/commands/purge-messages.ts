import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('purge-messages')
  .setDescription('Delete a number of recent messages in a channel (max 100)')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Channel to purge messages from')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('count')
      .setDescription('Number of messages to delete (1–100)')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export const meta = {
  example: '/purge-messages channel:#general count:25',
  output: '✅ Successfully deleted 25 messages from #general.'
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const count = interaction.options.getInteger('count', true);
  const channel = interaction.options.getChannel('channel', true) as TextChannel;

  if (count < 1 || count > 100) {
    return interaction.reply({
      content: '❌ You can only delete between 1 and 100 messages.',
      ephemeral: true,
    });
  }

  await interaction.reply({ content: `🧹 Deleting ${count} messages in <#${channel.id}>...`, ephemeral: true });

  try {
    const deleted = await channel.bulkDelete(count, true);
    await interaction.followUp({
      content: `✅ Successfully deleted ${deleted.size} messages from <#${channel.id}>.`,
      ephemeral: false,
    });
  } catch (err) {
    console.error(err);
    await interaction.followUp({
      content: `❌ Failed to delete messages. Make sure messages aren't older than 14 days.`,
      ephemeral: true,
    });
  }
}
