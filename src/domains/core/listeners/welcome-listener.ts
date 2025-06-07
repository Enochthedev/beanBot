import { Events, GuildMember, TextChannel } from 'discord.js';
import { cache } from '@/lib/cache';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const channelId = await cache.get<string>('welcome:channel');
    if (!channelId) return;
    const ch = member.guild.channels.cache.get(channelId) as TextChannel | undefined;
    if (!ch || !ch.isTextBased()) return;
    const message = [
      `👋 Welcome <@${member.id}> to **${member.guild.name}**!`,
      'Make sure to read the rules and say hi!',
    ].join('\n');
    await ch.send(message);
  }
};
