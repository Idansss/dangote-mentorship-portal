import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client. Uses the SERVICE-ROLE key, which bypasses RLS, so
// it must NEVER reach the browser bundle ('server-only' enforces that). The app's
// identity layer remains Auth.js + Entra (CLAUDE.md §2); Supabase Auth is not
// used. We talk to Supabase purely as infrastructure (Storage now, Realtime
// publish in M4) and do our own authorization in server actions via requireRole.
//
// Returns null when the project isn't configured, so callers can degrade
// gracefully (e.g. lib/storage falls back to the local-filesystem provider).

let cached: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // New-format secret key (sb_secret_…) preferred; legacy service_role JWT still works.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    cached = null;
    return cached;
  }

  cached = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}
