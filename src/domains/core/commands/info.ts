import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { cache } from '@/lib/cache';
import { loadCommands } from '@interactions/registry/commands';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('List commands available in this channel');

export async function execute(interaction: ChatInputCommandInteraction) {
  const cmds = await loadCommands();
  const entries = await Promise.all(
    cmds.map(async c => {
      const allowed = await cache.get<string>(`cmd:channel:${c.data.name}`);
      if (!allowed || allowed === interaction.channelId) {
        return `• /${c.data.name} – ${c.data.description}`;
      }
      return null;
    })
  );
  const list = entries.filter(Boolean).join('\n');
  await interaction.reply({ content: list || 'No commands available.', ephemeral: true });
}
