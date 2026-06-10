import 'server-only';
import { createLocalStorageProvider } from './local';
import type { StorageProvider } from './types';

export type { StorageProvider, PutObjectInput } from './types';

let cached: StorageProvider | null = null;

// Selects the active storage provider. A Supabase Storage provider slots in here
// behind an env check — exactly like getMailTransport()/getAiAdapter() — when
// Dangote adopts Supabase. Until then the local-filesystem provider keeps file
// features working in dev/CI.
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  cached = createLocalStorageProvider();
  return cached;
}
