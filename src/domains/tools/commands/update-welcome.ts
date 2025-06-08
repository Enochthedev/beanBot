import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('update-welcome')
  .setDescription('Post or refresh the welcome message with dynamic role buttons')
  .addStringOption(opt =>
    opt.setName('text')
      .setDescription('The welcome message to display (supports line breaks via Shift+Enter)')
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('The channel to post the welcome message to')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  
export const meta = {
  example: '/update-welcome channel:#welcome text:"Welcome to Bean DAO! Choose your roles below 👇"',
  output: '✅ Welcome message posted with role buttons.'
};
export async function execute(interaction: ChatInputCommandInteraction) {
  const content = interaction.options.getString('text', true);
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const guild = interaction.guild;

  if (!guild || !channel?.isTextBased()) {
    return interaction.reply({ content: '❌ Invalid guild or channel.', ephemeral: true });
  }

  const roles = guild.roles.cache.filter(role =>
    role.name.toLowerCase().startsWith('opt-')
  );

  if (roles.size === 0) {
    return interaction.reply({
      content: '⚠️ No self-assignable roles found. Create roles starting with `opt-`.',
      ephemeral: true,
    });
  }

  const buttons = roles.map(role =>
    new ButtonBuilder()
      .setCustomId(`toggle_role_${role.id}`)
      .setLabel(role.name.replace(/^opt-/, '').toUpperCase().slice(0, 80))
      .setStyle(ButtonStyle.Secondary)
  );

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
  }

  await channel.send({ content, components: rows });
  await interaction.reply({ content: '✅ Welcome message posted with role buttons.', ephemeral: true });
}
