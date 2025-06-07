import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { cache } from '@/lib/cache';

export const data = new SlashCommandBuilder()
  .setName('report')
  .setDescription('Report a user to the moderators')
  .addUserOption(opt =>
    opt.setName('user').setDescription('User to report').setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('reason').setDescription('Reason').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);
  await interaction.reply({ content: `✅ Report submitted for ${user.tag}.`, ephemeral: true });
  const guild = interaction.guild;
  if (!guild) return;
  const modLogId = await cache.get<string>('mod:log');
  if (modLogId) {
    const ch = guild.channels.cache.get(modLogId);
    if (ch && ch.isTextBased()) {
      await ch.send(`🚨 Report by <@${interaction.user.id}> against <@${user.id}>: ${reason}`);
    }
  }
  const member = guild.members.cache.get(user.id);
  if (member) {
    try { await member.timeout(10 * 60 * 1000, 'Reported by user'); } catch (err) { console.error(err); }
  }
}
