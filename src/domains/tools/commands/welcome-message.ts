import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextChannel,
  ChannelSelectMenuBuilder,
  ComponentType,
  ChannelType,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('welcome-message')
  .setDescription('Open a modal to submit a welcome message to a channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const meta = {
  example: '/welcome-message',
  output: '✅ Modal opened. You can now type and preview your welcome message.',
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('welcome_modal')
    .setTitle('📨 Send a Welcome Message');

  const messageInput = new TextInputBuilder()
    .setCustomId('welcome_text')
    .setLabel('Welcome message (supports markdown)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('👋 Welcome to Bean DAO!\nRead the rules, introduce yourself, and pick your roles.')
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}
