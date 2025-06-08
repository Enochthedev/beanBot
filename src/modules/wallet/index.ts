import { cache } from '@/lib/cache';

export async function getUserWallet(discordId: string): Promise<string | null> {
  return cache.get<string>(`wallet:${discordId}`);
}
