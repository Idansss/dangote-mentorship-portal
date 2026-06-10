# Changelog

## M0 — Foundations

- Next.js (App Router) + TypeScript strict, Tailwind CSS, shadcn-style UI primitives.
- Full Prisma/PostgreSQL schema for §5 (every table soft-deletable + cohort-scoped + bilingual-aware).
- Auth.js (NextAuth v5): Microsoft Entra ID SSO primary, email/password fallback, hashed invite links.
- Server-side RBAC for the six roles via `requireRole()`; edge route gating in `middleware.ts`.
- Cohort + Programme CRUD (Super-Admin-only) with Zod validation and audit logging.
- next-intl EN/FR scaffolding (cookie-based locale, no URL routing) with locale switcher.
- Seed: bilingual demo cohort — 15 mentors, 30 mentees, staff accounts, competency taxonomy, and a messy mentor import for the M1 validator.
- GitHub Actions CI: typecheck + lint + test; smoke/unit tests for roles, invites, and i18n parity.
- Invite creation: admin Invites page (create + copy-once link, list, revoke), Super-Admin-only for admin roles, audited, EN/FR, seeded demo invite, schema unit tests.
- Cohort & programme edit/archive UI wired to the existing update/archive actions (Super-Admin-only, confirm-before-archive).
- Login page hides the Microsoft Entra SSO button until real tenant credentials are configured (`isEntraConfigured()`).
- Playwright E2E (`npm run test:e2e`, port 3001): super-admin login → admin dashboard; unauthenticated redirect to login.
- Repo initialized as git; Husky pre-commit runs typecheck + lint + unit tests.

### M0 completion

- Entra SSO now links to admin-pre-created accounts of the same email (`allowDangerousEmailAccountLinking`) so SSO + admin-created accounts are one identity, not duplicates.
- Auth-endpoint rate limiting (§14): fixed-window limiter throttles credential sign-in (5/min per IP+email) and invite acceptance (10/min per IP); swappable store, unit-tested, with EN/FR "too many attempts" messaging.
- CI now runs the happy-path Playwright E2E against a Postgres service (migrate + seed + build + run). It serves a production build via `next start` instead of `next dev` to avoid first-request compile timeouts; verified locally via the same `CI=1` path (2/2 passing).
