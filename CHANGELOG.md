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
- Localized the root loading fallback (`app/loading.tsx`) — was hardcoded English.

### M0 deferred items (password reset, rate-limit store, lint)

- **Schema change:** added `password_reset_tokens` table (migration `20260610075205_password_reset_tokens`) storing only a hashed, single-use, 60-minute token.
- Password reset for credential accounts: public `/forgot-password` (no account enumeration — always reports "sent") → emailed link → `/reset-password/[token]` sets a new password, burns the token, signs the user in. Rate-limited, audited, EN/FR, with a "Forgot password?" link on login.
- Provider-agnostic mail transport (`lib/mail`, mirrors `lib/ai`): default "log" transport keeps the flow working before Resend/Graph is wired; gated by `MAIL_DEBUG` for body output.
- Rate limiter now sits behind a `RateLimitStore` seam (in-memory default, `setRateLimitStore()` to swap for Redis/Upstash) instead of a hardcoded map.
- Migrated `next lint` → ESLint flat config (`eslint.config.mjs`, `eslint .`); removed `.eslintrc.json`. No more Next 16 deprecation notice.
- Note: email verification has no entry point (accounts are seed- or invite-created, both pre-verified; no public self-registration), so no verification flow was built.
