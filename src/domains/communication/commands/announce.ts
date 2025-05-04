import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Make a server-wide announcement')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Channel to send the announcement')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('message')
      .setDescription('Announcement message')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('mention')
      .setDescription('Mention everyone or here (optional)')
      .addChoices(
        { name: '@everyone', value: '@everyone' },
        { name: '@here', value: '@here' },
        { name: 'None', value: 'none' }
      )
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const message = interaction.options.getString('message', true);
  const mention = interaction.options.getString('mention') || 'none';

  const toSend = (mention === 'none') ? message : `${mention} ${message}`;
  await channel.send(toSend);

  await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, ephemeral: true });
}