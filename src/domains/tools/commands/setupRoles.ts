import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';

const BASE_ROLES = [
  { name: 'artist', color: 0xF9A825, mentionable: true },
  { name: 'writer', color: 0x6A1B9A, mentionable: true },
  { name: 'dev', color: 0x0288D1, mentionable: true },
  { name: 'team', color: 0x388E3C, mentionable: false, permissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MentionEveryone] },
  { name: 'OG', color: 0xE64A19, mentionable: true },
  { name: 'verified', color: 0x43B581, mentionable: false }, // Discord green
];

export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription('Create core roles for the community and optionally add a new one')
  .addStringOption(opt =>
    opt.setName('addrole')
      .setDescription('Optionally add another role name')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Must be run in a server.', ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has('Administrator')) {
    await interaction.reply({ content: '❌ Only admins can use this command.', ephemeral: true });
    return;
  }

  let created = 0;
  await interaction.reply({ content: '⏳ Creating roles...', ephemeral: true });

  // Create base roles if missing
  for (const roleSpec of BASE_ROLES) {
    const existing = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleSpec.name);
    if (!existing) {
      await interaction.guild.roles.create({
        name: roleSpec.name,
        color: roleSpec.color,
        mentionable: !!roleSpec.mentionable,
        permissions: roleSpec.permissions ? roleSpec.permissions : [],
        reason: 'Web3 community core role setup',
      });
      created++;
    }
  }

  // Add custom role if requested
  const customRole = interaction.options.getString('addrole');
  if (customRole) {
    const exists = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === customRole.toLowerCase());
    if (!exists) {
      await interaction.guild.roles.create({
        name: customRole,
        mentionable: true,
        reason: 'Custom role via /setup-roles',
      });
      created++;
    }
  }

  await interaction.editReply({ content: `✅ Setup complete! ${created} role(s) created.` });
}