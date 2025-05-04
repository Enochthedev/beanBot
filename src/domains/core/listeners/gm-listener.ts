import { Message } from 'discord.js';

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
  "📬 GM! Did you check for surprise airdrops yet?",
  "💻 GM devs, may your code compile and your forks prosper.",
  "🌍 GM from the decentralized side of the internet.",
  "🧃 GM! Grab your juice and let’s make some protocol moves.",
  "⛓️ GM chainlink marines, stay connected.",
  "🪙 GM, may your ETH never sleep and your L2s stay snappy.",
  " GM! from beanBot",
];

export default async function gmListener(message: Message) {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();
  if (content === 'gm' || content.startsWith('gm ')) {
    const reply = gmReplies[Math.floor(Math.random() * gmReplies.length)];
    await message.reply(reply);
  }
}