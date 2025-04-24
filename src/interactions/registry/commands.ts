import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { getDirname } from '@utils/paths';
import type { SlashCommand } from '@interactions/shared';
import chalk from 'chalk';

const DOMAINS: string[] = ["core","tools"];

export async function loadCommands(): Promise<SlashCommand[]> {
  const commands: SlashCommand[] = [];
  console.log(chalk.cyanBright('🗂️  Loading slash commands from domains: ' + DOMAINS.join(', ')));
  for (const domain of DOMAINS) {
    const commandsDir = path.resolve(process.cwd(), 'src/domains', domain, 'commands');
    if (!fs.existsSync(commandsDir)) continue;
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    for (const file of files) {
      try {
        const fullPath = path.join(commandsDir, file);
        const mod = await import(pathToFileURL(fullPath).href);
        if (!mod.data || !mod.execute) {
          console.warn(chalk.yellow(`⚠️  Skipping invalid command: ${domain}/${file}`));
          continue;
        }
        commands.push({
          data: mod.data,
          execute: mod.execute,
          meta: mod.meta || {}
        });
        console.log(chalk.green(`  ✔ Loaded command: ${domain}/${file}`));
      } catch (err) {
        console.error(chalk.red(`❌ Error loading command ${domain}/${file}: ${err instanceof Error ? err.message : err}`));
      }
    }
  }
  console.log(chalk.cyanBright(`✨ Loaded ${commands.length} command(s) from ${DOMAINS.length} domain(s).`));
  return commands;
}
