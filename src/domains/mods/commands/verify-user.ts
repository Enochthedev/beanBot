import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('verify-user')
  .setDescription('Assign the verified role to a user')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to verify')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.options.getMember('user') as GuildMember;
  if (!member) return interaction.reply({ content: '❌ Could not find the specified user.', ephemeral: true });
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });

  const verifiedRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');
  if (!verifiedRole) {
    return interaction.reply({ content: '❌ Could not find a role named "verified".', ephemeral: true });
  }

  try {
    await member.roles.add(verifiedRole);
    const memberId = member.user.id;
    await interaction.reply({ content: `✅ <@${memberId}> has been verified.`, ephemeral: false });
  } catch (err) {
    console.error(err);
    return interaction.reply({ content: '❌ Failed to assign the role. Make sure I have permission.', ephemeral: true });
  }
}