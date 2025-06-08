import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('admin-info')
  .setDescription('Create or view the admin info channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const meta = {
  example: '/admin-info',
  output: '✅ Created admin guide in #bean-bot-admin-info (or returns the link if it already exists)'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  // Check if channel already exists
  const existing = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText && ch.name === 'bean-bot-admin-info'
  ) as TextChannel | undefined;

  if (existing) {
    return interaction.reply({
      content: `✅ Admin guide is already live at <#${existing.id}>`,
      ephemeral: true,
    });
  }

  // Create the channel with restricted permissions
  const adminChannel = await guild.channels.create({
    name: 'bean-bot-admin-info',
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      ...guild.roles.cache
        .filter(role => ['admin', 'mod'].includes(role.name.toLowerCase()))
        .map(role => ({
          id: role.id,
          allow: [PermissionFlagsBits.ViewChannel],
        })),
      {
        id: guild.ownerId,
        allow: [PermissionFlagsBits.ViewChannel],
        type: OverwriteType.Member,
      },
    ],
  });

  const guideMessage = `👋 **Welcome to the Bean Bot Admin Guide**

This channel is only visible to admins, mods, and the server owner.

Here’s how to manage Bean Bot effectively:

---

Run \`/admin-update\` to generate the latest list of all available commands, including usage examples.

Need help? Ping the Bean team or check https://beandao.xyz/bot/support`;

  await adminChannel.send({ content: guideMessage });

  return interaction.reply({
    content: `✅ Created admin guide in <#${adminChannel.id}>`,
    ephemeral: true,
  });
}
