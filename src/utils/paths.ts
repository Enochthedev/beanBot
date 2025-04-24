import { fileURLToPath } from 'url';
import path from 'path';

export function getDirname(metaUrl: string) {
  return path.dirname(fileURLToPath(metaUrl));
}
