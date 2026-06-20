# Deployment (Vercel + Supabase)

The app runs on **Vercel** (Next.js) with **Supabase** providing Postgres and
Storage. Identity stays **Auth.js + Entra** — Supabase Auth is not used.

## Prerequisites (one-time, already done for the current project)

- Supabase project `Dangote Mentorship` (ref `whgzjjjiruhluqxjjacy`, region
  `eu-central-1` / Frankfurt).
- Database migrated + seeded:
  ```
  npm run prisma:deploy   # applies migrations (uses DIRECT_URL)
  npm run db:seed         # loads the bilingual demo cohort
  ```
- Private Storage bucket `portal-files` (auto-created by
  `scripts/test-supabase-storage.mjs`; verify it stays **Private**).

## Vercel project settings

- **Framework preset:** Next.js
- **Build command:** `next build` (default). `postinstall: prisma generate`
  (in package.json) regenerates the Prisma client on every install — required,
  or Vercel's cached client goes stale and the build fails.
- **Install / Output:** defaults.
- **Production branch:** `main`.

> `next build` does NOT run migrations. Apply schema changes yourself with
> `npm run prisma:deploy` against Supabase before/after deploying, or add it to
> the Vercel build command if you want it automatic.

## Environment variables (Vercel → Settings → Environment Variables)

Set for **Production** (and Preview if you use preview deploys). Pull the real
values from your local `.env` — never commit them.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler, `:6543`, `?pgbouncer=true` |
| `DIRECT_URL` | Supabase session pooler, `:5432` (migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (browser-safe; M4 Realtime) |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (server-only; Storage) |
| `SUPABASE_STORAGE_BUCKET` | `portal-files` |
| `AUTH_SECRET` | 32+ byte random (`npx auth secret`) |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_URL` | the deployed origin, e.g. `https://<app>.vercel.app` — set after first deploy, then redeploy |

Optional / feature-gated (the app hides these features when unset):
`AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_TENANT_ID` (Entra SSO),
`ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) for AI assistants,
`MAIL_GRAPH_*` for email, `CRON_SECRET` for scheduled notifications.
Do **not** set the `SEED_*` vars in production (local seeding only).

## First deploy

1. Add the env vars above (skip `AUTH_URL` for now).
2. Deploy.
3. Copy the assigned `https://<app>.vercel.app` domain into `AUTH_URL` and
   redeploy so Auth.js callbacks resolve.
4. If using Entra SSO, add `https://<app>.vercel.app/api/auth/callback/microsoft-entra-id`
   as a redirect URI in the Entra app registration.

## Storage on serverless

The local-filesystem storage provider writes to disk and will NOT work on
Vercel's read-only serverless filesystem. As long as the Supabase env vars are
set, `getStorageProvider()` selects the Supabase provider automatically. Force
it explicitly with `STORAGE_PROVIDER=supabase` if needed.

## Secret hygiene

Rotate secrets that have been exposed: DB password (Supabase → Settings →
Database → Reset; update `DATABASE_URL`/`DIRECT_URL` in Vercel + local `.env`)
and `AUTH_SECRET` (`npx auth secret`; rotating invalidates existing sessions).
