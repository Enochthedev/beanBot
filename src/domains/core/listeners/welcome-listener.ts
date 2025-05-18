import { Events, GuildMember, TextChannel } from 'discord.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const welcomeChannelId = '1232096707463086171/1365083211322884188'; // change this!
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId) as TextChannel;

    if (!welcomeChannel || !welcomeChannel.isTextBased()) return;

    const welcomeMessage = [
      `👋 Welcome <@${member.id}> to **${member.guild.name}**!`,
      `We're glad to have you here. Be sure to check out <#rules_channel_id> and introduce yourself in <#introductions_channel_id>.`,
    ].join('\n');

    await welcomeChannel.send(welcomeMessage);
  }
};