// One-off verification: Supabase Storage round-trip against the configured
// project. Mirrors lib/storage/supabase.ts (private bucket, service-role/secret
// key) without importing it (that module is 'server-only'). Run:
//   node --env-file=.env scripts/test-supabase-storage.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'portal-files';

if (!url || !secret) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const key = `__healthcheck__/roundtrip-${Date.now()}.txt`;
const payload = `supabase storage ok @ ${new Date().toISOString()}`;
const bytes = new TextEncoder().encode(payload);

async function main() {
  // Ensure the private bucket exists.
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(`listBuckets failed: ${listErr.message}`);
  if (!buckets.some((b) => b.name === bucket)) {
    console.log(`Bucket "${bucket}" not found — creating it (private)...`);
    const { error: createErr } = await supabase.storage.createBucket(bucket, { public: false });
    if (createErr) throw new Error(`createBucket failed: ${createErr.message}`);
    console.log(`Created private bucket "${bucket}".`);
  } else {
    console.log(`Bucket "${bucket}" exists.`);
  }

  // Upload.
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(key, bytes, { contentType: 'text/plain', upsert: true });
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);
  console.log(`Uploaded ${bytes.length} bytes -> ${key}`);

  // Download + verify.
  const { data, error: dlErr } = await supabase.storage.from(bucket).download(key);
  if (dlErr || !data) throw new Error(`download failed: ${dlErr?.message ?? 'no data'}`);
  const back = new TextDecoder().decode(new Uint8Array(await data.arrayBuffer()));
  if (back !== payload) throw new Error(`round-trip mismatch: got "${back}"`);
  console.log('Round-trip verified: downloaded bytes match.');

  // Clean up the healthcheck object.
  const { error: rmErr } = await supabase.storage.from(bucket).remove([key]);
  if (rmErr) console.warn(`(cleanup) remove failed: ${rmErr.message}`);
  else console.log('Cleaned up healthcheck object.');

  console.log('\n✅ Supabase Storage is working.');
}

main().catch((e) => {
  console.error('\n❌ Storage check failed:', e.message);
  process.exit(1);
});
