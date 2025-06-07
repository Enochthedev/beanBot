import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import chalk from 'chalk';
import type { Client, Message } from 'discord.js';

const DOMAINS: string[] = ["core","tools","communication","web3","mods","mint"];

type MessageListener = (message: Message) => void | Promise<void>;

export async function registerMessageHandlers(client: Client) {
  console.log(chalk.cyanBright('🧩 Loading message listeners from domains: ' + DOMAINS.join(', ')));

  for (const domain of DOMAINS) {
    const listenersDir = path.resolve(process.cwd(), 'src/domains', domain, 'listeners');
    if (!fs.existsSync(listenersDir)) continue;

    const files = fs.readdirSync(listenersDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
      try {
        const fullPath = path.join(listenersDir, file);
        const mod = await import(pathToFileURL(fullPath).href);

        if (typeof mod.default !== 'function') {
          console.warn(chalk.yellow(`⚠️  Skipping invalid listener: ${domain}/${file}`));
          continue;
        }

        client.on('messageCreate', mod.default as MessageListener);
        console.log(chalk.green(`  ✔ Loaded message listener: ${domain}/${file}`));
      } catch (err) {
        console.error(chalk.red(`❌ Error loading listener ${domain}/${file}: ${err instanceof Error ? err.message : err}`));
      }
    }
  }

  console.log(chalk.cyanBright('✨ Finished loading all message listeners.'));
}