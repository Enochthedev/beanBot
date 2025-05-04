import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('set-channel-visibility')
  .setDescription('Set view permissions for a channel based on selected roles')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Select the channel to modify')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });

  const member = await guild.members.fetch(interaction.user.id);
  const hasAccess = member.permissions.has(PermissionFlagsBits.Administrator) ||
                    member.roles.cache.some(r => ['team', 'mod'].includes(r.name.toLowerCase()));

  if (!hasAccess) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const channel = interaction.options.getChannel('channel', true);

  // Step 1: List all roles
  const roles = guild.roles.cache.filter(r => r.name !== '@everyone');
  const roleList = roles.map(r => `• ${r.name}`).join('\n');

  await interaction.reply({
    content: `🛠️ Setting visibility for <#${channel.id}>.\n\n📜 Available roles:\n${roleList}\n\n📝 Now, **reply here** with:\n\`visible: role1, role2\`\n\`hidden: role3, role4\``,
    ephemeral: true,
  });

  // Step 2: Wait for user input
  const filter = (m: any) => m.author.id === interaction.user.id;
  const collected = await (interaction.channel as any)?.awaitMessages({
    filter,
    max: 1,
    time: 30000,
  });

  const reply = collected?.first()?.content?.trim();
  if (!reply) return interaction.followUp({ content: '❌ Timeout or no input received.', ephemeral: true });

  const visibleMatches = reply.match(/visible:\s*(.+)/i);
  const hiddenMatches = reply.match(/hidden:\s*(.+)/i);

  const visibleRoles = visibleMatches ? visibleMatches[1].split(',').map((r: string) => r.trim().toLowerCase()) : [];
  const hiddenRoles = hiddenMatches ? hiddenMatches[1].split(',').map((r: string) => r.trim().toLowerCase()) : [];

  const overwrites = [];

  for (const roleName of visibleRoles) {
    const role = roles.find(r => r.name.toLowerCase() === roleName);
    if (role) {
      overwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel],
      });
    }
  }

  for (const roleName of hiddenRoles) {
    const role = roles.find(r => r.name.toLowerCase() === roleName);
    if (role) {
      overwrites.push({
        id: role.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });
    }
  }

  // Always handle @everyone last for base permissions
  overwrites.push({
    id: guild.roles.everyone.id,
    deny: [PermissionFlagsBits.ViewChannel],
  });
  await (channel as TextChannel).edit({ permissionOverwrites: overwrites });

  await interaction.followUp({
    content: `✅ Permissions updated for <#${channel.id}>.\n👀 Visible to: ${visibleRoles.join(', ') || 'none'}\n🚫 Hidden from: ${hiddenRoles.join(', ') || 'none'}`,
    ephemeral: false,
  });
}