import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('clean-roles')
  .setDescription('Remove a role from all members, or delete it entirely')
  .addStringOption(opt =>
    opt.setName('role_name')
      .setDescription('Name of the role to remove (case-insensitive)')
      .setRequired(true)
  )
  .addBooleanOption(opt =>
    opt.setName('delete')
      .setDescription('Delete the role entirely after removing from members?')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });

  const roleName = interaction.options.getString('role_name', true).toLowerCase();
  const deleteAfter = interaction.options.getBoolean('delete') ?? false;

  const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName);
  if (!role) {
    return interaction.reply({ content: `❌ Role "${roleName}" not found.`, ephemeral: true });
  }

  // Safety: Prevent bot from touching protected roles
  if (role.managed || role.name.toLowerCase() === 'admin') {
    return interaction.reply({ content: '🚫 This role is protected and cannot be modified via bot.', ephemeral: true });
  }

  await interaction.reply({ content: `🔄 Cleaning role "${role.name}" from members...`, ephemeral: true });

  const membersWithRole = await guild.members.fetch();
  let count = 0;

  for (const member of membersWithRole.values()) {
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      count++;
    }
  }

  let summary = `✅ Removed role **${role.name}** from ${count} members.`;

  if (deleteAfter) {
    await role.delete("Cleaned by /clean-roles command");
    summary += `\n🗑️ Deleted the role from server.`;
  }

  await interaction.followUp({ content: summary, ephemeral: false });
}