# Production-Readiness Audit — BLAK MOH / Dangote Mentorship Portal

**Date:** 2026-06-20
**Auditor role:** Senior full-stack / DevOps / security engineer
**Scope:** Whole repository, live build, dependency tree, and dynamic scans of public pages.
**Reference frameworks:** OWASP Top 10, Mercari production-readiness checklist, Lighthouse, pa11y/WCAG 2.1 AA, OWASP ZAP baseline.

> **Update (remediation applied):** All three blockers, the high-priority items, and the medium/low items below have since been implemented and verified (typecheck/lint/266 tests/build green + live header/health/route checks). See [production-readiness-fixes.md](./production-readiness-fixes.md) for the per-item change log. The findings below are preserved as the original audit snapshot.

---

## Overall production-readiness score: **72 / 100**

**Verdict: READY FOR A CONTROLLED PILOT/BETA — NOT yet for unrestricted production.**
The codebase is genuinely well-engineered: it passes every one of its own quality gates (build, typecheck, lint, 266 tests), has a strong server-side authorization model, validates inputs with Zod at the boundary, audits mutations, and isolates data by cohort. The gap to "production" is a short list of fast-to-fix items — chiefly **missing HTTP security headers**, a **known-vulnerable dependency on the untrusted-input path (`xlsx`)**, a **publicly exposed demo route**, and **operational wiring** (monitoring, cron, shared rate-limit store). Fix the four blockers and the score moves into the high 80s.

### Score breakdown
| Area | Score | Notes |
|---|---|---|
| Build / type safety / tests | 19 / 20 | Build, typecheck, lint, 266 tests all green |
| Security (app) | 13 / 20 | Strong authz/RBAC/validation; **no security headers**, weak shared rate-limit |
| Dependencies / supply chain | 6 / 10 | `xlsx` high vuln on untrusted path, no CI scanning |
| Performance / caching | 8 / 10 | Lighthouse perf 90; mostly dynamic SSR (expected for a portal) |
| Accessibility | 7 / 10 | pa11y 0 errors public; Lighthouse flags contrast/target-size |
| SEO / metadata | 4 / 5 | Fine for an internal app, but no explicit `noindex`/robots |
| Backend / API design | 9 / 10 | IDOR-conscious file routes, cron auth, graceful AI degradation |
| Database | 5 / 5 | Cohort-scoped, soft-delete, migrations, pooled connection |
| Deployment config | 5 / 10 | Good docs, but no `vercel.json` (cron won't fire), no rollback/restore drill |
| Monitoring / logging / CI-CD gates | 3 / 10 | No error tracking, no healthcheck, CI has no security/a11y/perf gates |

---

## Project profile (what was detected)

| Dimension | Finding |
|---|---|
| Framework | Next.js 15 (App Router, React 19, RSC), TypeScript strict |
| Package manager | npm (`package-lock.json`, `npm ci` in CI) |
| Build system | `next build` (Turbopack for dev only) |
| Hosting assumption | Vercel + Supabase (Postgres + Storage), Frankfurt region (`docs/deployment.md`) |
| Database | PostgreSQL via Prisma (59 models, 92 `cohortId` references, 10 migrations) |
| Auth | Auth.js v5 (NextAuth beta.25), JWT sessions, Microsoft Entra ID SSO + email/password (bcrypt, 12 rounds) |
| Authorization | `requireRole()` server-side guard + edge route gating in `middleware.ts` |
| API routes | `/api/auth/[...nextauth]`, `/api/cron/notifications`, `/api/agreements/[id]/pdf`, `/api/goals/evidence/[id]`, `/api/avatar/[id]` |
| File uploads | Excel/CSV import (admin), goal evidence, avatars → private Supabase Storage bucket |
| Email | Microsoft Graph (app-only) with a "log" fallback transport |
| External integrations | Anthropic (primary AI) + OpenAI (fallback), Supabase, Entra ID, MS Graph mail/calendar |
| Payments | **None** (no payment logic exists — not applicable) |
| i18n | next-intl, EN/FR, locale via cookie (no locale routing) |

---

## Verified evidence (commands actually run)

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ exit 0, no errors/warnings |
| TypeScript | `npm run typecheck` | ✅ exit 0 |
| Lint | `npm run lint` | ✅ exit 0 |
| Unit/smoke tests | `npm test` | ✅ **266 passed / 31 files** (matching: 24, validation: 16) |
| Dependency audit | `npm audit` | ⚠️ 11 total (1 critical, 3 high, 7 moderate); prod-only: 6 (1 high) |
| Lighthouse (desktop, `/login`) | `npx lighthouse` | Perf **90**, A11y **92**, Best-practices **100**, SEO **83** |
| Accessibility | `npx pa11y-ci` (`/login`, `/`) | ✅ 0 errors (WCAG2AA, HTML CodeSniffer ruleset) |
| Secret in git | `git ls-files .env*` | ✅ only `.env.example` tracked; `.env` never committed |
| Client secret leak | `grep process.env src/**/*.tsx` (non-`NEXT_PUBLIC`) | ✅ none |

> Dynamic scans covered **public pages only** — authenticated dashboards were not scanned because they require a live session. Run pa11y/Lighthouse against logged-in routes before go-live (see CI suggestions).

---

## CRITICAL BLOCKERS (must fix before launch)

### B1 — No HTTP security headers anywhere
`next.config.mjs` defines no `headers()`. Live response on `/login` confirms **no CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy**, and it leaks `X-Powered-By: Next.js`. For an enterprise portal carrying confidential mentor↔mentee data this is a launch blocker (clickjacking, MIME sniffing, no transport pinning, no XSS containment).

**Fix — `next.config.mjs`:**
```js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next inlines a small runtime script; 'unsafe-inline' on style is needed for Tailwind/RSC.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`.trim(),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // remove X-Powered-By
  outputFileTracingRoot: projectRoot,
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```
> Validate the CSP against the running app (the `script-src 'unsafe-inline'` is a pragmatic start; tighten to a nonce-based policy as a follow-up). Test forum/messages, the design route, and the PDF/avatar streams after enabling.

### B2 — `xlsx` (SheetJS) high-severity vuln on the untrusted-input path, no npm fix
`src/features/imports/parse.ts` calls `XLSX.read(buffer)` on **admin-uploaded** files. The registry `xlsx@0.18.5` has **Prototype Pollution (GHSA-4r6h-8v6p-xvw6)** and **ReDoS (GHSA-5pgg-2g8v-p4x9)** with **no fix available on npm**. The import flow is the single place that parses untrusted data (CLAUDE.md §14), so this is the highest-value dependency finding even though it is admin-gated.

**Fix — migrate to the maintained SheetJS distribution (npm registry copy is abandoned):**
```bash
npm rm xlsx
npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz   # official current build
```
The import is `import * as XLSX from 'xlsx'` — unchanged. As defense-in-depth, keep enforcing the 5 MB body limit and consider a row cap + a worker/timeout around `XLSX.read` to bound ReDoS exposure.

### B3 — Public `/design` component gallery exposed in production
`src/app/(public)/design/page.tsx` is whitelisted in `auth.config.ts` `PUBLIC_PREFIXES` (the code comment literally says *"gate or remove before production"*). It's a 20 kB dev/demo surface reachable without a session.

**Fix:** remove `/design` from `PUBLIC_PREFIXES` in `src/lib/auth/auth.config.ts` (so it requires auth), or delete the route, or gate it behind `process.env.NODE_ENV !== 'production'`.

---

## HIGH-PRIORITY ISSUES

### H1 — In-memory rate limiter is per-instance → ineffective on serverless
`src/lib/auth/rate-limit.ts` uses a per-process `Map`. On Vercel (many short-lived lambdas) brute-force protection on `/login`, password reset, and invite acceptance is largely bypassed because attempts spread across instances. The module is already designed for a swap (`setRateLimitStore`).
**Fix:** back it with Upstash Redis (or Supabase) and call `setRateLimitStore()` at boot. Until then, document that login throttling is best-effort.

### H2 — No error tracking / monitoring
No Sentry/OpenTelemetry/structured logger anywhere. Production errors are invisible. The app uses `console.warn` only.
**Fix:** add `@sentry/nextjs` (wizard: `npx @sentry/wizard@latest -i nextjs`), set `SENTRY_DSN`, and wire `instrumentation.ts` + a `global-error.tsx`. Scrub PII (the AI adapter already avoids logging prompt content — keep that discipline).

### H3 — Cron endpoint will never fire on Vercel (no `vercel.json`)
`/api/cron/notifications` is correct and auth-gated, but there is **no `vercel.json`**, so Vercel Cron never calls it — scheduled notifications and the daily digest silently never run.
**Fix — add `vercel.json`:**
```json
{
  "crons": [{ "path": "/api/cron/notifications", "schedule": "0 7 * * *" }]
}
```
> Vercel Cron calls the path with its own auth header; either also accept Vercel's `Authorization` or keep `CRON_SECRET` and trigger via an external scheduler. Confirm `CRON_SECRET` is set in Vercel.

### H4 — CI has no security, dependency, accessibility, or performance gates
`.github/workflows/ci.yml` runs typecheck/lint/test/e2e only. None of the tools from the audit brief (npm audit/Snyk, Lighthouse CI, pa11y-ci, ZAP) gate merges.
**Fix:** add the workflows in the *GitHub Actions* section below.

### H5 — No `global-error.tsx`
`error.tsx` and `not-found.tsx` exist, but an error thrown in the **root layout** falls through to an unstyled browser error page.
**Fix:** add `src/app/global-error.tsx` (also the place to report to Sentry).

---

## MEDIUM-PRIORITY ISSUES

- **M1 — Most AI actions are not rate-limited.** Only `copilot` (20/min) and `search` (60/min) call `rateLimit()`. The Goal Coach, Icebreaker, Meeting-prep, Reviews, Sessions, and Next-action generators are auth-gated but unthrottled → an authenticated user can burn AI tokens/cost. Add a per-user limiter to each AI server action.
- **M2 — No healthcheck endpoint.** Add `src/app/api/health/route.ts` returning `{ ok: true }` (optionally a shallow `SELECT 1`) for uptime monitoring and load-balancer probes.
- **M3 — `X-Powered-By: Next.js` disclosed.** Fixed by `poweredByHeader: false` (B1).
- **M4 — Accessibility gaps vs the WCAG 2.1 AA requirement (CLAUDE.md §14).** Lighthouse flags `color-contrast` and `target-size` on `/login`. pa11y's ruleset passed, but Lighthouse's axe ruleset is stricter — reconcile both, and scan authenticated pages.
- **M5 — SEO / indexing not controlled.** SEO score 83; no `robots.txt`/`sitemap`, no `metadataBase`. A confidential internal portal should explicitly **discourage indexing**, not improve it. Add a `robots.ts` returning `disallow: '/'` (or `X-Robots-Tag: noindex` header) and set `metadataBase`.
- **M6 — No Node version pin.** CI uses Node 22 but there's no `.nvmrc` or `engines` field, so contributor/build environments can drift. Add both.
- **M7 — Backup / restore + retention not evidenced.** Supabase provides automated backups, but there's no documented **restore drill**, PITR confirmation, or per-cohort **data-retention/right-to-delete** policy that CLAUDE.md §14 requires. Document and test a restore.
- **M8 — Migrations are manual on deploy.** `docs/deployment.md` notes `next build` does not run migrations — fine, but make `prisma migrate deploy` an explicit, gated release step so schema drift can't reach prod silently.

---

## LOW-PRIORITY IMPROVEMENTS

- **L1 — Session lifetime not explicit.** Auth.js JWT default is 30 days; set `session.maxAge` deliberately (e.g. 8–24h for an internal tool) in `auth.config.ts`.
- **L2 — `README.md` is stale** ("M0 — Foundations complete") while the app is at M2 + Tier 1. Update status.
- **L3 — Tighten CSP to nonces** once B1 is stable (remove `'unsafe-inline'` for scripts).
- **L4 — Add a dependency-update cadence** (Dependabot/Renovate) so `next`/`postcss` moderate advisories don't accumulate.
- **L5 — Bundle note:** `/messages/[conversationId]` ships 63 kB of route JS — fine, but worth watching as messaging grows.

---

## Gaps grouped by category

**Security gaps:** no security headers (B1); `xlsx` vuln on untrusted path (B2); public `/design` (B3); per-instance rate limiting (H1); most AI actions unthrottled (M1); `X-Powered-By` disclosure (M3). *Strengths:* server-side `requireRole` on every mutation, IDOR-conscious file routes (`avatar`/`evidence`/`pdf` check ownership/role + opaque keys + `private, no-store`), cron `Bearer` auth that fails closed, bcrypt 12, no committed secrets, no client-side secret leakage, Zod at 21/22 action boundaries, 16 audited mutation modules.

**Performance gaps:** none critical — Lighthouse perf 90 (FCP 0.3 s, LCP 0.7 s, TBT 0 ms, CLS 0.03). Speed-index 4.4 s is the soft spot. Self-hosted font, mostly dynamic SSR (correct for an auth portal). Watch messaging bundle (L5).

**SEO gaps:** no `robots`/`sitemap`/`metadataBase`; for this product the right move is explicit `noindex` (M5).

**Accessibility gaps:** color-contrast + target-size on public pages; authenticated pages unmeasured (M4).

**Backend / API gaps:** no healthcheck (M2); AI actions unthrottled (M1); cron not scheduled (H3). *Strengths:* clean route handlers, force-dynamic where needed, graceful AI degradation + provider fallback.

**Database gaps:** none material — cohort scoping, soft-delete, pooled `DATABASE_URL` + `DIRECT_URL` for migrations, 10 ordered migrations. Document retention/restore (M7).

**Deployment gaps:** no `vercel.json` (H3); manual migrations (M8); no documented rollback/restore (M7); no Node pin (M6).

**Monitoring / logging gaps:** no error tracking, no healthcheck, no uptime/alerting, CI has no security/a11y/perf gates (H2, H4, M2).

---

## Exact files that need changes

| File | Change | Severity |
|---|---|---|
| `next.config.mjs` | Add `headers()` + `poweredByHeader: false` | B1 |
| `package.json` / lockfile | Replace `xlsx` with SheetJS CDN tarball; add `engines.node` | B2 / M6 |
| `src/lib/auth/auth.config.ts` | Remove `/design` from `PUBLIC_PREFIXES`; set `session.maxAge` | B3 / L1 |
| `vercel.json` (new) | Add `crons` entry | H3 |
| `src/app/global-error.tsx` (new) | Styled root error boundary + Sentry capture | H5 |
| `src/app/api/health/route.ts` (new) | Liveness endpoint | M2 |
| `src/app/robots.ts` (new) | `disallow: '/'` for the internal app | M5 |
| `src/lib/auth/rate-limit.ts` (+ boot) | Wire Upstash store via `setRateLimitStore()` | H1 |
| `src/features/{goals,icebreaker,meetings,reviews,sessions,next-action}/*.ts` | Add per-user `rateLimit()` to AI actions | M1 |
| `.github/workflows/*.yml` (new) | Security/a11y/perf gates | H4 |
| `instrumentation.ts` + Sentry config (new) | Error tracking | H2 |
| `.nvmrc` (new) | `22` | M6 |
| `README.md` | Update milestone status | L2 |

---

## Commands to run

```bash
# B2 — replace the abandoned npm xlsx with the maintained SheetJS build
npm rm xlsx
npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

# Reduce remaining advisories (review the diff; next/postcss are transitive)
npm audit
npm audit fix            # safe, non-breaking only

# H2 — error tracking
npx @sentry/wizard@latest -i nextjs

# H1 — shared rate-limit store
npm i @upstash/redis

# Re-verify after changes
npm run typecheck && npm run lint && npm test && npm run build

# Dynamic re-scan (server must be running, e.g. `npm run start -p 3001`)
npx lighthouse http://localhost:3001/login --preset=desktop --view
npx pa11y-ci --config .pa11yci.json
```

---

## GitHub Actions workflow suggestions

### 1) Dependency + supply-chain gate — `.github/workflows/security.yml`
```yaml
name: Security
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      # Fail the build on prod-dependency highs/criticals (dev-only vulns excluded).
      - run: npm audit --omit=dev --audit-level=high
  snyk:
    runs-on: ubuntu-latest
    if: ${{ secrets.SNYK_TOKEN != '' }}
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
        with: { args: --severity-threshold=high }
```

### 2) Lighthouse CI — `.github/workflows/lighthouse.yml`
```yaml
name: Lighthouse CI
on: pull_request
jobs:
  lhci:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      DIRECT_URL: postgresql://postgres:postgres@localhost:5432/postgres
      AUTH_SECRET: ci-placeholder
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci && npx prisma generate && npm run build
      - run: npm i -g @lhci/cli
      - run: lhci autorun --collect.startServerCommand="npm run start" --collect.url=http://localhost:3000/login --upload.target=temporary-public-storage
```
Add `lighthouserc.json` with assertions, e.g. `"categories:accessibility": ["error", {"minScore": 0.95}]`, `"categories:performance": ["warn", {"minScore": 0.85}]`.

### 3) Accessibility — `.github/workflows/pa11y.yml`
```yaml
name: pa11y
on: pull_request
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci && npx prisma generate && npm run build
      - run: (npm run start &) && npx wait-on http://localhost:3000/login
      - run: npx pa11y-ci --config .pa11yci.json   # commit the .pa11yci.json used in this audit
```

### 4) OWASP ZAP Baseline — `.github/workflows/zap.yml`
```yaml
name: ZAP Baseline
on:
  workflow_dispatch:        # run on demand against a deployed preview/staging URL
jobs:
  zap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ vars.STAGING_URL }}   # e.g. a Vercel preview URL
          fail_action: false                # baseline = passive; review alerts, don't hard-fail initially
```

---

## OWASP ZAP feasibility

**Yes — safe to add.** The ZAP *baseline* scan is **passive** (it spiders and observes; it does not attack), so it's safe to run against a deployed preview/staging URL. Practical guidance for this app:
- Point it at a **Vercel preview deployment** (`workflow_dispatch` + `vars.STAGING_URL`) rather than building/serving inside the runner — simpler and closer to prod.
- Because nearly everything is **behind auth**, the unauthenticated baseline will mostly cover `/`, `/login`, `/about`, `/faq`, `/invite/*`. That's still valuable (it will immediately flag the **missing security headers** from B1).
- For authenticated coverage, graduate to the **ZAP full scan with an authentication script/context** later — keep `fail_action: false` until the alert baseline is triaged, then turn it on.
- Do **not** run active/attack scans against the Supabase production database.

---

## Comparison vs the Mercari production-readiness checklist

| Mercari area | Status | Notes |
|---|---|---|
| **Code quality / tests** | ✅ Strong | 266 tests, the two non-negotiable engines fully covered, CI green |
| **Availability / scalability** | ⚠️ Partial | Serverless + pooled Postgres scales, but per-instance rate limiter (H1) and in-memory caches don't |
| **Security** | ⚠️ Gaps | Excellent authz/validation; **missing headers (B1)**, vuln dep (B2), public route (B3) |
| **Monitoring / alerting** | ❌ Missing | No error tracking, no healthcheck, no uptime/alerts (H2, M2) |
| **Logging** | ⚠️ Basic | Audit log table is good; no structured app logging / PII scrubbing policy beyond AI adapter |
| **Capacity / performance** | ✅ Good | Lighthouse 90; needs load expectations for ~120 mentors / ~300 mentees per cohort documented |
| **Deployment / rollback** | ⚠️ Partial | Good deploy doc; no `vercel.json` cron (H3), no documented rollback, manual migrations (M8) |
| **Data management / backup** | ⚠️ Partial | Supabase backups exist; no restore drill / retention policy evidenced (M7) |
| **Dependency management** | ⚠️ Gaps | No CI scanning, no Dependabot/Renovate (H4, L4) |
| **Incident / on-call** | ❌ Missing | No runbook, alert routing, or on-call defined (expected — pre-launch) |
| **Configuration management** | ✅ Good | Clear `.env.example`, secrets in env, `docs/deployment.md`, secret-rotation notes |

---

## Final launch checklist

**Blockers (do not launch without these):**
- [ ] **B1** Security headers + `poweredByHeader: false` added and verified live (CSP doesn't break forum/messages/PDF/avatar).
- [ ] **B2** `xlsx` replaced with the maintained SheetJS build; `npm audit --omit=dev` shows no high/critical.
- [ ] **B3** `/design` removed from public routes (or deleted / dev-gated).

**High (before pilot expands beyond a closed group):**
- [ ] **H1** Shared (Redis/Upstash) rate-limit store wired via `setRateLimitStore()`.
- [ ] **H2** Sentry (or equivalent) capturing errors, with PII scrubbing.
- [ ] **H3** `vercel.json` cron added; `CRON_SECRET` set; confirmed a run fired.
- [ ] **H4** CI security + Lighthouse + pa11y gates merged and passing.
- [ ] **H5** `global-error.tsx` added.

**Medium / operational:**
- [ ] **M1** AI server actions rate-limited per user.
- [ ] **M2** `/api/health` endpoint + external uptime monitor.
- [ ] **M4** Reconcile Lighthouse contrast/target-size; run a11y on authenticated pages.
- [ ] **M5** `robots.ts` set to `noindex` (internal app) + `metadataBase`.
- [ ] **M6** `.nvmrc` + `engines.node`.
- [ ] **M7** Documented + tested DB restore; per-cohort retention policy written.
- [ ] **M8** `prisma migrate deploy` as an explicit gated release step.

**Pre-launch verification:**
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` all green.
- [ ] Rotate `AUTH_SECRET` and DB password if ever exposed (see `docs/deployment.md`).
- [ ] Confirm `SEED_*` vars are **not** set in production.
- [ ] Confirm Supabase Storage bucket `portal-files` is **Private**.
- [ ] ZAP baseline run against the preview URL; alerts triaged.
- [ ] Re-run the full Production Readiness Audit (CLAUDE.md M2 launch gate) — zero unresolved Critical/High.
