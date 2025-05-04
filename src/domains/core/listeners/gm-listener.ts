import { Message } from 'discord.js';

export default async function gmListener(message: Message) {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  const specialCases: Record<string, string> = {
    'can i get a gm': `🫡 Of course ser, here's your blessed GM for the day ☀️`,
    'gimme a gm': `🧃 You rang? GM granted, wagmi.`,
    'drop a gm': `📤 Deploying gm to chain... confirmed ✅`,
    'any gms today': `☀️ It's always gm o'clock in web3!`,
  };

  for (const phrase in specialCases) {
    if (content.includes(phrase)) {
      return message.reply(specialCases[phrase]);
    }
  }

  if (/\bgm\b/i.test(content)) {
    const gmReplies = [
      "☀️ GM, GM! Ready to deploy good vibes?",
      "📈 Wagmi fam — let's mint the day!",
      "🌅 GM anon, may your bags be green and your gas be low.",
      "🚀 GM! The floor is rising and so are we.",
      "🧙‍♂️ GM web3 wizard, time to manifest some magic.",
      "🔓 GM! May your wallets stay safe and your airdrops be plenty.",
      "🐸 GM ser, may the memes be ever in your favor.",
      "💼 GM builders, let’s ship something today!",
      "💎 GM diamond hands — another day to hold strong.",
    ];
    const reply = gmReplies[Math.floor(Math.random() * gmReplies.length)];
    await message.reply(reply);
  }
}