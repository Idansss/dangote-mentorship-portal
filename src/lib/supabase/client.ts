import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser-side Supabase client. Uses the public ANON key only (safe to ship to
// the client) and is intended for Realtime subscriptions in M4 (messaging /
// forum live updates, CLAUDE.md §10). It carries NO elevated privileges:
// confidential reads/writes go through server actions, never this client.
//
// NOTE: there are no Realtime consumers yet — the messaging and forum features
// that subscribe to channels land in M4. This is the foundation those features
// plug into, not a feature itself. Returns null when unconfigured.

let cached: SupabaseClient | null | undefined;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // New-format publishable key (sb_publishable_…) preferred; legacy anon JWT still works.
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    cached = null;
    return cached;
  }

  cached = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
