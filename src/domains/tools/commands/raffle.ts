import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { cache } from '@/lib/cache';

export const data = new SlashCommandBuilder()
  .setName('raffle')
  .setDescription('Start or join a raffle')
  .addSubcommand(sub =>
    sub.setName('start')
      .setDescription('Start a new raffle')
      .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('enter')
      .setDescription('Enter the active raffle')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const raffleKey = 'raffle:entries';
  if (sub === 'start') {
    const winners = interaction.options.getInteger('winners', true);
    await cache.set('raffle:winners', winners);
    await cache.del(raffleKey);
    await interaction.reply(`🎉 Raffle started! Use /raffle enter to participate.`);
  } else if (sub === 'enter') {
    const list = await cache.get<string[]>(raffleKey) || [];
    if (!list.includes(interaction.user.id)) list.push(interaction.user.id);
    await cache.set(raffleKey, list);
    await interaction.reply({ content: '✅ You are entered in the raffle!', ephemeral: true });
  }
}
