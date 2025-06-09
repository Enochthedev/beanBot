import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '@libs/prisma';

export const data = new SlashCommandBuilder()
  .setName('set-mod-role')
  .setDescription('Assign the moderator role for this server')
  .addRoleOption(opt =>
    opt.setName('role')
      .setDescription('Moderator role')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole('role', true);
  if (!interaction.guildId) {
    return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });
  }

  await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId },
    update: { modRoleIds: { set: [role.id] } },
    create: { guildId: interaction.guildId, adminRoleIds: [], modRoleIds: [role.id] }
  });

  await interaction.reply({ content: `✅ Moderator role set to <@&${role.id}>`, ephemeral: true });
}
