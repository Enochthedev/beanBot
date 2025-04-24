// src/domains/core/commands/purgeRoles.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';

const SAFE_ROLES = ['@everyone', 'admin', 'mod', 'founder']; // Adjust as needed

export const data = new SlashCommandBuilder()
  .setName('clear-roles')
  .setDescription('Delete all roles except @everyone and safelist (admin only)')
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

  let deleted = 0;
  await interaction.reply({ content: '⏳ Purging roles...', ephemeral: true });

  for (const [, role] of interaction.guild.roles.cache) {
    if (SAFE_ROLES.map(r => r.toLowerCase()).includes(role.name.toLowerCase())) continue;
    if (role.managed) continue; // skip bot/integration roles
    try {
      await role.delete('Bulk role purge by admin via /purge-roles');
      deleted++;
    } catch (e) { /* Ignore failures */ }
  }

  await interaction.editReply({ content: `✅ Purged ${deleted} roles. Kept: ${SAFE_ROLES.join(', ')}.` });
}