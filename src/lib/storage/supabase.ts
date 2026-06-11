import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { PutObjectInput, StorageProvider } from './types';

// Supabase Storage provider (production). Implements the same opaque-key
// interface as the local provider; feature code is unchanged. Files live in a
// PRIVATE bucket (CLAUDE.md §14: agreements/evidence/attachments are
// confidential) — access control stays in the authenticated routes that serve
// them, never via a public URL. Reads/writes use the service-role client, so
// they bypass RLS by design and authorization is enforced upstream in the
// server action / route handler.

function bucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? 'portal-files';
}

// Same conservative key rule as the local provider: app-generated, but treated
// as untrusted. No leading slash, no traversal.
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;

function assertSafeKey(key: string): void {
  if (!SAFE_KEY.test(key) || key.includes('..')) {
    throw new Error('Invalid storage key.');
  }
}

export function createSupabaseStorageProvider(): StorageProvider {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      'Supabase Storage selected but NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.',
    );
  }

  return {
    id: 'supabase',
    async put({ key, bytes, contentType }: PutObjectInput): Promise<void> {
      assertSafeKey(key);
      const { error } = await supabase.storage.from(bucket()).upload(key, bytes, {
        contentType,
        upsert: true,
      });
      if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    },
    async get(key: string): Promise<Uint8Array> {
      assertSafeKey(key);
      const { data, error } = await supabase.storage.from(bucket()).download(key);
      if (error || !data) {
        throw new Error(`Supabase Storage download failed: ${error?.message ?? 'no data'}`);
      }
      return new Uint8Array(await data.arrayBuffer());
    },
  };
}
