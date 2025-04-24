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

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('add-topics')
  .setDescription('Auto-set all channel topics based on predefined suggestions')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });

  let updated = 0;
  for (const [channelName, topic] of Object.entries(CHANNEL_TOPICS)) {
    const channel = interaction.guild.channels.cache.find(c => c.name === channelName);
    if (channel instanceof TextChannel) {
      await channel.setTopic(topic);
      updated++;
    }
  }

  await interaction.reply({ content: `✅ Set topics for ${updated} channels!`, ephemeral: true });
}