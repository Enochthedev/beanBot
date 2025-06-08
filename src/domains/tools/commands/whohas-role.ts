import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('whohas-role')
  .setDescription('List all users with a specified role')
  .addRoleOption(option =>
    option
      .setName('role')
      .setDescription('The role to check for')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
export const meta = {
  example: '/whohas-role role:@Verified',
  output: '✅ **X** users have the role **Verified**:\n• @user1\n• @user2\n...'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole('role', true);

  const members = await interaction.guild!.members.fetch();
  const usersWithRole = members.filter(member => member.roles.cache.has(role.id));

  if (usersWithRole.size === 0) {
    return interaction.reply({ content: `🔍 No members currently have the role **${role.name}**.`, ephemeral: true });
  }

  const MAX_DISPLAY = 20;
  const displayList = usersWithRole
    .map(member => `• <@${member.id}>`)
    .slice(0, MAX_DISPLAY)
    .join('\n');

  const extraCount = usersWithRole.size - MAX_DISPLAY;

  let message = `✅ **${usersWithRole.size}** users have the role **${role.name}**:\n${displayList}`;
  if (extraCount > 0) {
    message += `\n...and **${extraCount}** more.`;
  }

  await interaction.reply({ content: message, ephemeral: false });
}
