import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PutObjectInput, StorageProvider } from './types';

// Local-filesystem storage for dev/CI. Files live OUTSIDE the public dir under
// STORAGE_LOCAL_DIR (default ./.storage), so they are never web-served directly —
// authenticated routes read them by key (CLAUDE.md §14). The Supabase Storage
// provider will replace this in production behind the same interface.

function baseDir(): string {
  return path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? '.storage');
}

// Reject anything that could escape the base dir. Keys are app-generated, but
// treat them as untrusted regardless (CLAUDE.md §14).
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;

function resolveKey(key: string): string {
  if (!SAFE_KEY.test(key) || key.includes('..')) {
    throw new Error('Invalid storage key.');
  }
  const full = path.resolve(baseDir(), key);
  if (full !== baseDir() && !full.startsWith(baseDir() + path.sep)) {
    throw new Error('Storage key escapes the storage root.');
  }
  return full;
}

export function createLocalStorageProvider(): StorageProvider {
  return {
    id: 'local',
    async put({ key, bytes }: PutObjectInput): Promise<void> {
      const full = resolveKey(key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, bytes);
    },
    async get(key: string): Promise<Uint8Array> {
      const full = resolveKey(key);
      return new Uint8Array(await readFile(full));
    },
  };
}
