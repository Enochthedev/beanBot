import { SlashCommandBuilder, ChatInputCommandInteraction, GuildTextBasedChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('clear-channels')
  .setDescription('Delete all channels except three you specify (Admin only)')
  .addStringOption(opt =>
    opt.setName('keep1').setDescription('Channel name to keep (e.g. general)').setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('keep2').setDescription('Channel name to keep (e.g. announcements)').setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('keep3').setDescription('Channel name to keep (e.g. web3-talk)').setRequired(true)
  );

export const meta = {
  example: '/clear-channels keep1:"general" keep2:"announcements" keep3:"web3-talk"',
  output: '✅ Cleared X channels. Kept: **general, announcements, web3-talk**.'
};

export async function execute(interaction: ChatInputCommandInteraction) {
  // Permission check (Admins only)
  if (!interaction.memberPermissions?.has('Administrator')) {
    await interaction.reply({ content: '❌ Only server admins can use this command.', ephemeral: true });
    return;
  }

  const keepNames = [
    interaction.options.getString('keep1', true).toLowerCase(),
    interaction.options.getString('keep2', true).toLowerCase(),
    interaction.options.getString('keep3', true).toLowerCase(),
  ];

  // Confirm action
  await interaction.reply({
    content: `⚠️ Are you sure you want to delete **all channels** except: **${keepNames.join(', ')}**? Reply with \`yes\` to confirm.`,
    ephemeral: true,
  });

  // Await confirmation (simplest approach, you can use buttons/modals for UX)
  const filter = (m: any) => m.author.id === interaction.user.id;
  const collected = await (interaction.channel as any)?.awaitMessages({ filter, max: 1, time: 15000 });

  const response = collected?.first()?.content?.trim().toLowerCase();
  if (response !== 'yes') {
    await interaction.followUp({ content: '❌ Cancelled. No channels deleted.', ephemeral: true });
    return;
  }

  let deleted = 0;
  const guild = interaction.guild;
  if (!guild) return;

  // Iterate and delete channels
  for (const [id, channel] of guild.channels.cache) {
    if (
      channel.isTextBased() &&
      !keepNames.includes(channel.name.toLowerCase())
    ) {
      await channel.delete("Bulk clear via /clear-channels");
      deleted++;
    }
  }

  await interaction.followUp({
    content: `✅ Cleared ${deleted} channels. Kept: **${keepNames.join(', ')}**.`,
    ephemeral: false,
  });
}
