import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { spawn } from 'child_process';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('mint-fast')
  .setDescription('Mint an NFT using the Rust mint bot')
  .addStringOption(opt =>
    opt.setName('to').setDescription('Recipient address').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const to = interaction.options.getString('to', true);
  // The compiled Rust binary lives under src/modules after building.
  // Resolve the path relative to this command's directory so it works in both
  // ts-node and compiled environments.
  const bin = path.resolve(
    __dirname,
    '../../../modules/nft_mint_bot/target/release/nft_mint_bot'
  );

  const child = spawn(bin, [to]);
  let output = '';

  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  child.on('close', code => {
    if (code === 0) {
      interaction.reply({ content: output || 'Mint completed', ephemeral: true });
    } else {
      interaction.reply({ content: 'Mint failed', ephemeral: true });
    }
  });
}
