import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js"
import { getTwitterAuthUrl } from "@/modules/twitter/auth"
import { cache } from "@/lib/cache"

export const data = new SlashCommandBuilder()
  .setName("connect")
  .setDescription("Connect your server to a Twitter account (write access)")
  .addSubcommand(sub =>
    sub.setName("twitter").setDescription("Authorize a Twitter account for this server")
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) {
    return interaction.reply({ content: "This command must be used in a server.", ephemeral: true })
  }

  const isAdmin = interaction.memberPermissions?.has("Administrator")
  if (!isAdmin) {
    return interaction.reply({ content: "Only admins can connect a Twitter account.", ephemeral: true })
  }

  const { url, verifier } = await getTwitterAuthUrl()

  await cache.set(`twitter:verifier:${interaction.guildId}`, verifier, { ttl: 600 })

  const button = new ButtonBuilder()
    .setLabel("Authorize Twitter")
    .setStyle(ButtonStyle.Link)
    .setURL(url)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button)

  await interaction.reply({
    content: "Click below to connect your server’s Twitter account:",
    components: [row],
    ephemeral: true
  })
}
