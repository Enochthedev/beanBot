// tools/create-role.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
extend([namesPlugin]);

const PERMISSION_PRESETS: Record<string, bigint[]> = {
  basic: [],
  verified_user: [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
  ],
  helper: [
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.MuteMembers,
  ],
  event_host: [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.CreateEvents,
  ],
  content_creator: [
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.ManageWebhooks,
  ],
  moderator: [
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.MuteMembers,
  ],
  admin: [
    PermissionFlagsBits.Administrator,
  ],
};

export const data = new SlashCommandBuilder()
  .setName('create-role')
  .setDescription('Create a custom role with optional color and permissions')
  .addStringOption(opt =>
    opt.setName('role')
      .setDescription('Name of the role to create')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('color')
      .setDescription('Color name, hex, rgb, or "random"')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt.setName('mentionable')
      .setDescription('Should the role be mentionable?')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('preset_permissions')
      .setDescription('Choose what this role can do')
      .addChoices(
        { name: 'None (default)', value: 'basic' },
        { name: 'Verified User', value: 'verified_user' },
        { name: 'Helper', value: 'helper' },
        { name: 'Content Creator', value: 'content_creator' },
        { name: 'Event Host', value: 'event_host' },
        { name: 'Moderator', value: 'moderator' },
        { name: 'Admin', value: 'admin' },
      )
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ Only admins can use this command.', ephemeral: true });
  }

  const roleName = interaction.options.getString('role', true).trim();
  const colorInput = interaction.options.getString('color');
  const mentionable = interaction.options.getBoolean('mentionable') ?? false;
  const preset = interaction.options.getString('preset_permissions') ?? 'basic';

  const existing = interaction.guild.roles.cache.find(
    r => r.name.toLowerCase() === roleName.toLowerCase()
  );
  if (existing) {
    return interaction.reply({ content: `⚠️ Role **${roleName}** already exists.`, ephemeral: true });
  }

  await interaction.reply({ content: `⏳ Creating role **${roleName}**...`, ephemeral: true });

  let color: number | undefined;
  if (colorInput) {
    if (colorInput.toLowerCase() === 'random') {
      const randomColor = Math.floor(Math.random() * 0xffffff);
      color = randomColor;
    } else {
      const parsed = colord(colorInput);
      if (parsed.isValid()) {
        color = parseInt(parsed.toHex().replace('#', ''), 16);
      } else {
        await interaction.followUp({
          content: `⚠️ Invalid color **${colorInput}**, using default.`,
          ephemeral: true,
        });
      }
    }
  }

  const permissions = PERMISSION_PRESETS[preset] ?? [];

  await interaction.guild.roles.create({
    name: roleName,
    color,
    mentionable,
    permissions,
    reason: `Role created via /create-role by ${interaction.user.tag}`,
  });

  await interaction.editReply({
    content: `✅ Created role **${roleName}** with preset **${preset}**${color ? ` and color \`#${color.toString(16)}\`` : ''}.`,
  });
}