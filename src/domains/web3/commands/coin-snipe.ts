import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { spawn } from 'child_process';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('coin-snipe')
  .setDescription('Attempt to snipe a new coin')
  .addStringOption(opt =>
    opt.setName('token').setDescription('Token address').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const token = interaction.options.getString('token', true);
  const script = path.resolve(__dirname, '../../../../modules/coin_sniper/sniper.py');
  const child = spawn('python3', [script, token]);
  let output = '';
  child.stdout.on('data', chunk => output += chunk.toString());
  child.on('close', () => {
    interaction.reply({ content: output || 'Finished', ephemeral: true });
  });
}
