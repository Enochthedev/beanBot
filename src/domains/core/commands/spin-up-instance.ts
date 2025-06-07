import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { spawn } from 'child_process';

export const data = new SlashCommandBuilder()
  .setName('spin-up-instance')
  .setDescription('Run docker compose to start another bot instance')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const child = spawn('docker-compose', ['up', '-d']);
  child.on('close', code => {
    interaction.reply({ content: code === 0 ? 'Instance starting...' : 'Failed to start.', ephemeral: true });
  });
}
