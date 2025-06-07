import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban-user')
  .setDescription('Ban a member from the server')
  .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ Must be used in a server.', ephemeral: true });
  try {
    await guild.members.ban(user.id, { reason });
    await user.send(`🚫 You have been banned from **${guild.name}**. Reason: ${reason}`);
    await interaction.reply({ content: `✅ Banned ${user.tag}.`, ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Failed to ban user.', ephemeral: true });
  }
}
