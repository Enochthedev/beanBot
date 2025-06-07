import { Message } from 'discord.js';

const triggers: Record<string, string[]> = {
  hello: ['Hey there!', 'Hello friend!', 'Hi! Ready to build?'],
  help: ['Need assistance? Try `/info` to see available commands.'],
  thanks: ['You are welcome!', 'Anytime ser.'],
  gm: ['gm!', 'Good morning 🌞', 'gm gm'],
  gn: ['good night!', 'sleep well!', 'gn ser'],
};

export default async function chatterListener(message: Message) {
  if (message.author.bot) return;
  const lc = message.content.toLowerCase();
  for (const key of Object.keys(triggers)) {
    if (lc.includes(key)) {
      const replies = triggers[key];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      await message.reply(reply);
      break;
    }
  }
}
