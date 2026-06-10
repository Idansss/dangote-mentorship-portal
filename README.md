# Dangote Mentorship Portal

An intelligent, bilingual (EN/FR) mentorship operating system for Dangote Group.
See [CLAUDE.md](./CLAUDE.md) for the full product specification and milestone plan.

## Status

**M0 — Foundations** complete. See [CHANGELOG.md](./CHANGELOG.md).

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind + shadcn-style UI · Prisma + PostgreSQL ·
Auth.js (Microsoft Entra ID SSO + email/password) · next-intl (EN/FR).

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env   # then fill in DATABASE_URL, AUTH_SECRET, Entra ID, …

# 3. Database
npx prisma migrate dev --name init   # create schema (requires a running Postgres)
npm run db:seed                       # seed the bilingual demo cohort

# 4. Run
npm run dev
```

Demo accounts (all use `SEED_DEFAULT_PASSWORD`, default `ChangeMe!2026`):

| Role            | Email                    |
| --------------- | ------------------------ |
| Super Admin     | `admin@dangote.com`      |
| Programme Admin | `prog.admin@dangote.com` |
| Trainer         | `trainer@dangote.com`    |
| Reviewer        | `reviewer@dangote.com`   |

Mentors/mentees are seeded as `mentor.*@dangote.com` / `mentee.*@dangote.com`.

## Scripts

| Script                | Purpose                          |
| --------------------- | -------------------------------- |
| `npm run dev`         | Start the dev server             |
| `npm run typecheck`   | `tsc --noEmit`                   |
| `npm run lint`        | ESLint                           |
| `npm test`            | Vitest unit/smoke tests          |
| `npm run db:seed`     | Seed the demo cohort             |
| `npm run prisma:migrate` | Create/apply a dev migration  |
