import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Role,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('manage-selfrole')
  .setDescription('Manage self-assignable roles (opt- prefix based)')
  .addSubcommand(sub =>
    sub.setName('add')
      .setDescription('Mark a role as self-assignable')
      .addRoleOption(opt =>
        opt.setName('role')
          .setDescription('Role to make self-assignable (will be renamed to opt-<name>)')
          .setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('remove')
      .setDescription('Remove a role from self-assignable list')
      .addRoleOption(opt =>
        opt.setName('role')
          .setDescription('Role to unmark (will remove opt- prefix)')
          .setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('list')
      .setDescription('List all self-assignable roles')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export const meta = {
  example: '/manage-selfrole add role:@Designer',
  output: '✅ Role **opt-Designer** is now self-assignable.'
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  if (!guild) return;

  if (sub === 'add') {
    const role = interaction.options.getRole('role', true) as Role;
    if (!role.name.toLowerCase().startsWith('opt-')) {
      await role.setName(`opt-${role.name}`);
    }
    return interaction.reply({ content: `✅ Role **${role.name}** is now self-assignable.`, ephemeral: true });
  }

  if (sub === 'remove') {
    const role = interaction.options.getRole('role', true) as Role;
    if (role.name.toLowerCase().startsWith('opt-')) {
      const newName = role.name.replace(/^opt-/, '').trim();
      await role.setName(newName);
      return interaction.reply({ content: `🚫 Role **${newName}** is no longer self-assignable.`, ephemeral: true });
    } else {
      return interaction.reply({ content: `⚠️ That role is not marked as self-assignable.`, ephemeral: true });
    }
  }

  if (sub === 'list') {
    const selfRoles = guild.roles.cache.filter(role => role.name.toLowerCase().startsWith('opt-'));
    const embed = new EmbedBuilder()
      .setTitle('🎭 Self-Assignable Roles')
      .setDescription(
        selfRoles.size > 0
          ? selfRoles.map(role => `- ${role.name}`).join('\n')
          : 'No self-assignable roles found.'
      )
      .setColor(0x43b581);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
