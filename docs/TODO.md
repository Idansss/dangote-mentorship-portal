# Dangote Mentorship Portal — Outstanding Work

> Generated from an implementation audit on 2026-06-10 against CLAUDE.md,
> docs/experience-layer.md, and docs/design-system.md.
>
> **State:** M0 ✅ · M1 ✅ · M2 ✅ · Experience Layer Tier 1 ~90% · Design System ✅ ·
> **M3 ✅ complete** · **M4 ~5% (schema only)** · M5 not started.
>
> All later-milestone database tables already exist and are migrated — what's
> missing below is **feature code**, not schema. Within each milestone,
> prerequisites are listed first.

---

## M3 — Reviews & Health

- [x] **Forms Builder** — admin CRUD over `FormDefinition` (role-specific question sets, editable without code). Everything review-shaped depends on this. → `src/features/forms/`, `src/app/(admin)/admin/forms/` *(done 2026-06-10: list/new/edit screens, bilingual typed questions, active toggle, soft-archive, audited, Zod-validated, 12 unit tests, EN/FR)*
- [x] **Mid-term review** fill/submit flow (`FormResponse`, autosave draft) → `src/features/reviews/`, `src/app/(dashboard)/mid-term-review/` *(done 2026-06-10: dynamic per-type renderer of the active form, bilingual fields, accessible rating/yes-no radiogroups, autosave draft, cohort-isolation-guarded submit into `FormResponse` linked to a lazily-ensured `MidtermReview` cycle, audited metadata-only; journey mid-term step now real + deep-linked; seeded bilingual form; 21 unit tests on the dynamic answer validator; EN/FR)*
- [x] **Final review** fill/submit flow → `src/app/(dashboard)/final-review/` *(done 2026-06-10: reuses the type-parameterized `reviews` engine — shared `ReviewScreen`/`ReviewForm`; `/final-review` page, nav link, journey `final` step now real + deep-linked, seeded bilingual FINAL form; EN/FR)*
- [x] **Review aggregation** (per-pair + cohort roll-up for executives) *(done 2026-06-10: pure `aggregateAnswers` rolls up rating averages/distribution, single-select & boolean tallies, text answered-counts — 8 unit tests; `getReviewRollup` data layer adds completion %, per-pair midterm/final matrix, language participation; wired into the Reviewer/Executive dashboard screen replacing the stub; EN/FR)*
- [x] **AI Review Assistant** — summarize progress, detect low engagement / at-risk pairs, draft programme report; populate `aiSummary` → `src/features/reviews/assistant.ts` *(done 2026-06-10: pure prompt builder + defensive parser — 9 unit tests; `requestReviewReport` drafts a grounded report from the real roll-up (advisory, no write), `saveReviewSummary` human-gates the write to `MidtermReview`/`FinalReview.aiSummary` (audited); editable AIContainer panel on the reviewer dashboard; degrades when AI unconfigured; EN/FR)*
- [x] **AI Risk & Engagement Monitor** — flag unmet pairs, stale goals, missing logs, unsubmitted reviews, inactive mentors; **metadata-only** → `src/features/risk/` *(done 2026-06-10: pure `evaluatePairRisk` rules — no-sessions/stale/no-goals/awaiting-approval/midterm+final-incomplete with severities + thresholds, 12 unit tests; `getCohortRisk` builds per-pair facts from session/goal/review METADATA ONLY (never content — confidentiality posture pinned by tests); `RiskPanel` surfaced on the admin home and reviewer dashboard; EN/FR)*
- [x] **Reviewer/Executive dashboard** — replace stub with real data (programme impact, completion/engagement, skills, challenges, recommendations) → `src/app/(dashboard)/dashboard/reviewer/page.tsx` *(done 2026-06-10: real screen = completion tiles + per-question aggregates + per-pair completion matrix + language & department participation (aggregation item) + the AI report panel (summary/at-risk/recommendations) + the at-risk pairs panel; EN/FR)*
- [x] **Trainer dashboard** — replace stub with real data (own batches) → `src/app/(dashboard)/dashboard/trainer/page.tsx` *(done 2026-06-10: pure `summarizeBatch`/`computeTrainerTotals` — 6 unit tests; `getTrainerDashboard` reads the cohort's batches with attendance + assessment + materials; cards with attendance progress bars + totals tiles; scoped to active cohort — no facilitator FK in schema, noted; EN/FR)*

## M4 — Engagement

- [ ] **Community Forum** — categories, threads, threaded replies, reactions, role badges → `src/features/forum/`, `src/app/(dashboard)/forum/`
  - [ ] Anonymous post option
  - [ ] French-speaking corner
  - [ ] Per-post translate toggle (wire existing translation cache into real posts)
  - [ ] Search
  - [ ] Moderation queue (pin/lock/remove/report) → `src/app/(admin)/admin/forum/`
  - [ ] Reply/mention notifications
- [ ] **Instant messaging** — realtime 1:1 DMs, default-provisioned per matched pair → `src/features/messaging/`, `src/app/(dashboard)/messages/`
  - [ ] Typing indicators, read receipts, presence
  - [ ] File/image attachments
  - [ ] Per-message translate toggle
  - [ ] Unread badge + email/push on unread
  - [ ] Message search
  - [ ] **Admin-override policy hook — implemented but OFF by default, logged**
  - [ ] Group conversations behind feature flag (optional)
- [ ] **Monthly clinics** — calendar, topic of month, RSVP, attendance, pre-clinic challenge submission, success-story submission, anonymous question, discussion board → `src/features/clinics/`, `src/app/(dashboard)/clinics/`
  - [ ] **Clinic Assistant** — group challenges (incl. forum threads) by theme, suggest agenda, post-clinic summary + action points
- [ ] **AI Newsletters** — admin-reviewed, bilingual, scheduled send, recipient/open tracking → `src/features/newsletters/`, `src/app/(admin)/admin/newsletters/`
  - [ ] **Newsletter Assistant** — draft from real portal activity (admin reviews before send)
- [ ] **Confidentiality enforcement** end-to-end once messaging + risk exist (metadata-only verified; content access requires logged override)

## M5 — Integrations & Launch (not started)

- [ ] Zoom create/join wired into meetings
- [ ] Calendar read integration (Outlook write exists; add Google Calendar + read views)
- [ ] WhatsApp Business API behind feature flag
- [ ] PDF export (cohort/programme reports — server-side renderer)
- [ ] Excel export (SheetJS)
- [ ] Audit-log surfacing UI → `src/app/(admin)/admin/audit-logs/`
- [ ] Pilot config + launch checklist
- [ ] Full Production Readiness Audit with integrations live

## M1 / M2 / Tier-1 polish (partials)

- [ ] Live **Google Sheets connection** (currently export-file upload only) → `src/features/imports/parse.ts`
- [ ] Confirm **calendar month/week/list** views all render → `src/app/(dashboard)/calendar/page.tsx`
- [ ] Verify `globals.css` declares the raw token variables Tailwind references
- [ ] Resolve open **M2 audit finding H1** (cohort-isolation / IDOR) + the 3 small fixes from the M2 audit

## Non-functional / cross-cutting to verify

- [ ] Runtime a11y verification — keyboard focus, WCAG 2.2 AA contrast, 360px mobile (no automated a11y assertions beyond one happy-path E2E)
- [ ] Per-milestone Playwright happy-path E2E for M3/M4 features
- [ ] Decide intent of public `/design` preview route (currently unauthenticated internal gallery)

---

## Explicitly NOT to build (scope guard)

- **Experience Layer Tier 2** — pulse checks, health/quality score, engagement heatmap, intervention/rematch workflow, resource recommendations, templates, recognition wall, certificates, manager visibility. Out of scope until instructed.
- **Experience Layer Tier 3** — gamification, AI learning paths, voice notes, NL search, cohort benchmarking, exit interviews, AI final impact report. Cohort-2 / later.
