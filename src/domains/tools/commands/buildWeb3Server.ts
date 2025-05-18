const WEB3_JOBS_STRUCTURE = [
  { 
    category: 'Start Here',
    channels: [
        { name: '👋-welcome', visibleTo: ['unverified'] },
        { name: '📢-announcements', visibleTo: ['unverified'] },
        { name: '📄-rules', visibleTo: ['unverified'] },
    ]
  },
  { 
    category: 'Opportunities',
    channels: [
      { name: '💼-job-board', visibleTo: ['verified'] },
      { name: '🛠️-bounties', visibleTo: ['verified'] },
      { name: '🤝-partnerships', visibleTo: ['verified'] },
    ]
  },
  { 
    category: 'Community',
    channels: [
      { name: '💬-general', visibleTo: ['verified'] },
      { name: '🎙️-introductions', visibleTo: ['verified'] },
      { name: '🌍-regional', visibleTo: ['verified'] },
    ]
  },
  { 
    category: 'Talent',
    channels: [
      { name: '🚀-showcase', visibleTo: ['verified'] },
      { name: '👨‍💻-dev-talk', visibleTo: ['verified'] },
      { name: '🎨-designers', visibleTo: ['verified'] },
      { name: '📝-writers', visibleTo: ['verified'] },
    ]
  },
  { 
    category: 'Employers',
    channels: [
      { name: '🏢-post-a-job', visibleTo: ['team', 'OG'] },
      { name: '🔎-talent-search', visibleTo: ['team', 'OG'] },
    ]
  },
  { 
    category: 'Learning',
    channels: [
      { name: '📚-resources', visibleTo: ['verified'] },
      { name: '🗓️-events', visibleTo: ['verified'] },
      { name: '🤓-ask-mentors', visibleTo: ['verified'] },
    ]
  },
  { 
    category: 'Voice',
    channels: [
      // { name: 'General Voice', type: 'voice', visibleTo: ['verified'] }
    ]
  },
  { 
    category: 'Support',
    channels: [
      { name: '❓-help', visibleTo: ['everyone'] },
      { name: '📬-contact-staff', visibleTo: ['everyone'] },
    ]
  },
];

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('build-channels')
  .setDescription('Auto-build your Web3 community channel structure with permissions')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export const meta = {
  example: '/build-channels',
  output: '✅ Structure created with permissions! Onboarding is ready to go.'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });
  if (!interaction.memberPermissions?.has('Administrator')) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  await interaction.reply({ content: '⏳ Building server structure and permissions...', ephemeral: true });

  // Get relevant roles
  const everyoneRole = guild.roles.everyone;
  const verifiedRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');
  const teamRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'team');
  const OGRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'og');
  if (!verifiedRole || !teamRole || !OGRole) {
    return interaction.editReply({ content: '❌ Missing one or more required roles. Run `/setup-roles` first.' });
  }

  for (const group of WEB3_JOBS_STRUCTURE) {
    // Create category
    const category = await guild.channels.create({
      name: `「 ${group.category} 」`,
      type: ChannelType.GuildCategory,
    });

    for (const ch of group.channels) {
      // Permissions
      let permissionOverwrites: any[] = [];
      if (ch.visibleTo?.includes('unverified')) {
    // Visible ONLY to unverified users (no "verified" role)
    permissionOverwrites.push({
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
    });
    permissionOverwrites.push({
        id: verifiedRole.id,
        deny: [PermissionFlagsBits.ViewChannel],
    });
    } else {
    // Hide from @everyone (unverified), show to listed roles
    permissionOverwrites.push({
        id: everyoneRole.id,
        deny: [PermissionFlagsBits.ViewChannel],
    });
    if (ch.visibleTo?.includes('verified')) {
        permissionOverwrites.push({
        id: verifiedRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        });
    }
    if (ch.visibleTo?.includes('team')) {
        permissionOverwrites.push({
        id: teamRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        });
    }
    if (ch.visibleTo?.includes('OG')) {
        permissionOverwrites.push({
        id: OGRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        });
    }
}

      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites,
      });
    }
  }

  await interaction.editReply({ content: `✅ Structure created with permissions! Onboarding is ready to go.` });
}