# Production-Readiness Fixes — Progress Log

Living checklist tracking remediation of the findings in
[production-readiness-report.md](./production-readiness-report.md).
Each item is ticked here when done, with the files touched and a one-line note.

Legend: ⬜ todo · ✅ done · 🔁 env-gated (activates when its env vars are set)

## Blockers

- ✅ **B1** — Security headers + `poweredByHeader: false` (`next.config.mjs`)
- ✅ **B2** — Replace abandoned `xlsx` with the maintained SheetJS build
- ✅ **B3** — Gate the public `/design` route (prod requires auth)

## High

- ✅ **H5** — `global-error.tsx` root error boundary
- ✅ **H2** — Error tracking (Sentry, env-gated) — full server+edge+browser via `withSentryConfig`
- 🔁 **H1** — Shared rate-limit store (Upstash, env-gated)
- ✅ **H3** — `vercel.json` cron schedule
- ✅ **H4** — CI gates: security / Lighthouse / pa11y / ZAP workflows

## Medium

- ✅ **M1** — Rate-limit AI server actions
- ✅ **M2** — `/api/health` endpoint
- ✅ **M4** — Login accessibility (contrast / target-size) — re-verify on a prod build + authed pages
- ✅ **M5** — `robots.ts` (noindex) + `metadataBase`
- ✅ **M6** — Node version pin (`.nvmrc` + `engines`)
- ✅ **M7** — Backup/restore + retention policy docs (`docs/deployment.md`)
- ✅ **M8** — Gated `prisma migrate deploy` release step (`docs/deployment.md`)

## Low

- ✅ **L1** — Explicit `session.maxAge` (12h)
- ✅ **L2** — Update stale README status
- ✅ **L4** — Dependabot config
- L3 — Nonce-based CSP — deferred follow-up (tighten after B1 is stable)
- L5 — Messaging bundle size — watch only, no action

---

## Verification (after all changes)

`npm run typecheck` ✅ · `npm run lint` ✅ (0 errors) · `npm test` ✅ 266/266 ·
`npm run build` ✅ · `npm audit --omit=dev` → high/critical cleared (only
transitive `postcss`-via-`next` moderates remain, fixed by a Next major bump).

---

## Change notes

- **B1** `next.config.mjs`: added `headers()` returning CSP, HSTS, X-Frame-Options:DENY,
  X-Content-Type-Options:nosniff, Referrer-Policy, Permissions-Policy, X-Robots-Tag:noindex;
  set `poweredByHeader: false`. CSP allows the Supabase origin (+ wss) in `connect-src`.
- **B2** Replaced `xlsx@0.18.5` (npm, abandoned, prototype-pollution + ReDoS, no fix) with
  `xlsx@0.20.3` from the official SheetJS CDN tarball. Import unchanged (`parse.ts`). Prod
  audit high/critical now clear.
- **B3** `auth.config.ts`: `/design` only joins `PUBLIC_PREFIXES` when `NODE_ENV !== production`.
- **H5** Added `src/app/global-error.tsx` (own `<html>`/`<body>`, static copy, Sentry capture);
  renamed `app/error.tsx`'s export to `RouteError` and wired `Sentry.captureException`.
- **H2** Added `@sentry/nextjs`, now wired **fully via `withSentryConfig`** (next.config.mjs):
  `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, `src/instrumentation-client.ts`,
  and `src/instrumentation.ts` (`register()` loads the per-runtime init + re-exports `onRequestError`).
  Error boundaries (`app/error.tsx`, `app/global-error.tsx`) call `Sentry.captureException`; the
  server seam `src/lib/observability/report.ts` is used by the cron route. All no-op until
  `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set. **The edge `EvalError` from the first hand-rolled
  attempt is resolved** — `withSentryConfig` makes the edge runtime use Sentry's edge-safe build
  (verified: clean build + live `/login` 200 + headers + `/api/health` 200, no middleware errors).
  CSP allows `https://*.sentry.io`. Setup steps in `docs/deployment.md`; env in `.env.example`.
- **H1** Added `@upstash/redis` + `src/lib/auth/rate-limit-shared.ts` (`checkRateLimit`, atomic
  INCR+EXPIRE, fails open). Switched all 6 limiter call sites (login, forgot-password, reset,
  invite-accept, copilot, search) to `await checkRateLimit`. Falls back to the in-memory limiter
  when Upstash env is unset. Pure `rate-limit.ts` + its tests untouched.
- **H3** Added `vercel.json` with a daily cron (`0 7 * * *`) hitting `/api/cron/notifications`.
- **H4** Added `.github/workflows/{security,lighthouse,pa11y,zap-baseline}.yml`, `lighthouserc.json`,
  `.pa11yci.json`. Security job fails on prod high/critical; Snyk optional via `SNYK_TOKEN`.
- **M1** Added per-user `checkRateLimit` (10/min) to the Goal Coach, Session Assistant, Icebreaker,
  Meeting-prep, and Review-report actions; next-action degrades to its deterministic baseline on limit.
- **M2** Added `src/app/api/health/route.ts` (`SELECT 1`, 200/503, no data leak).
- **M4** `login/page.tsx` + `login-form.tsx`: removed footer `opacity-70` (restored AA contrast),
  bumped copyright `ink-3 → ink-2`, gave footer/forgot links `min-h-6` and the password-reveal button
  a `size-8` hit area (≥24px target size).
- **M5** Added `src/app/robots.ts` (disallow all); `metadataBase` + `robots:{index:false}` in `layout.tsx`.
- **M6** Added `.nvmrc` (22) + `engines.node` (`>=22 <23`).
- **M7/M8** `docs/deployment.md`: added gated `prisma migrate deploy` release step, Supabase
  backups/PITR + restore-drill procedure, and a data-retention/right-to-delete section.
- **L1** `auth.config.ts`: `session.maxAge = 12h` (was the 30-day Auth.js default).
- **L2** README status updated to M0–M2 + Tier 1; links the fixes log.
- **L4** Added `.github/dependabot.yml` (weekly npm + actions; `xlsx` ignored — CDN tarball).
