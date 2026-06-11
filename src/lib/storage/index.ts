import 'server-only';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { createLocalStorageProvider } from './local';
import { createSupabaseStorageProvider } from './supabase';
import type { StorageProvider } from './types';

export type { StorageProvider, PutObjectInput } from './types';

let cached: StorageProvider | null = null;

// Selects the active storage provider behind an env check — exactly like
// getMailTransport()/getAiAdapter(). Supabase Storage is used when explicitly
// requested (STORAGE_PROVIDER=supabase) or whenever the Supabase project is
// configured; otherwise the local-filesystem provider keeps file features
// working in dev/CI.
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
  const useSupabase =
    provider === 'supabase' || (provider !== 'local' && isSupabaseConfigured());
  cached = useSupabase ? createSupabaseStorageProvider() : createLocalStorageProvider();
  return cached;
}
