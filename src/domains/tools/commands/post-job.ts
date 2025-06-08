// commands/post-job.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('post-job')
  .setDescription('Post a job to the community')
  .addSubcommand(sub =>
    sub.setName('single')
      .setDescription('Post a single job')
      .addStringOption(opt =>
        opt.setName('title').setDescription('Job title').setRequired(true))
      .addStringOption(opt =>
        opt.setName('description').setDescription('Job description').setRequired(true))
      .addStringOption(opt =>
        opt.setName('link').setDescription('Link to job posting').setRequired(false))
  )
  .addSubcommand(sub =>
    sub.setName('mass')
      .setDescription('Post multiple jobs via CSV')
      .addAttachmentOption(opt =>
        opt.setName('file').setDescription('Upload a CSV file with jobs').setRequired(true))
  );
  
export const meta = {
  example: '/post-job single title:"React Developer" description:"Build UIs" link:"https://jobs.web3.com/react"',
  output: '📝 **Job Posted:**\n**React Developer**\nBuild UIs\n🔗 https://jobs.web3.com/react'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'single') {
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description', true);
    const link = interaction.options.getString('link');

    await interaction.reply({
      content: `📝 **Job Posted:**\n**${title}**\n${description}${link ? `\n🔗 ${link}` : ''}`,
    });
  } else if (sub === 'mass') {
    const file = interaction.options.getAttachment('file', true);
    await interaction.reply({
      content: `📥 Processing job file: ${file.name} (Mass job posting coming soon)`,
      ephemeral: true,
    });
  }
}
