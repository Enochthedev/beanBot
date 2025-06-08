import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, ChannelType } from 'discord.js';

const CHANNEL_TOPICS = {
  '👋-welcome': 'Welcome to the server! Start your journey here.',
  '📢-announcements': 'Important updates and news.',
  '📄-rules': 'Please read and follow the server rules.',
  '💼-job-board': 'Latest Web3 job listings.',
  '🛠️-bounties': 'Find and share bounties.',
  '🤝-partnerships': 'Collaboration opportunities.',
  '💬-general': 'Main community chat.',
  '🎙️-introductions': 'Introduce yourself!',
  '🌍-regional': 'Regional/local meetups.',
  '🚀-showcase': 'Show off your work.',
  '👨‍💻-dev-talk': 'Developer discussions.',
  '🎨-designers': 'Design-focused discussions.',
  '📝-writers': 'Writers unite!',
  '🏢-post-a-job': 'Employers post jobs here.',
  '🔎-talent-search': 'Employers look for talent here.',
  '📚-resources': 'Learning resources.',
  '🗓️-events': 'Upcoming events.',
  '🤓-ask-mentors': 'Ask questions to mentors.',
  '❓-help': 'Get support and help.',
  '📬-contact-staff': 'Contact the staff team.',
};

export const data = new SlashCommandBuilder()
  .setName('add-topics')
  .setDescription('Auto-set all channel topics based on predefined suggestions')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const meta = {
  example: '/add-topics',
  output: '✅ Set topics for X channels that matched the naming pattern.'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });

  await interaction.deferReply({ ephemeral: true }); // Acknowledge right away

  let updated = 0;
  // Loop through all entries in the topics map
  for (const [channelName, topic] of Object.entries(CHANNEL_TOPICS)) {
    // Find a text channel with EXACT name match (case-sensitive)
    const channel = interaction.guild.channels.cache.find(
      c =>
        c.type === ChannelType.GuildText && // Only text channels
        c.name === channelName              // Exact name
    ) as TextChannel | undefined;

    if (channel) {
      await channel.setTopic(topic);
      updated++;
    }
  }

  await interaction.editReply({ content: `✅ Set topics for ${updated} channel${updated !== 1 ? 's' : ''}!` });
}
