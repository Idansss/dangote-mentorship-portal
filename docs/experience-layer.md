# Dangote Mentorship Portal — Experience Layer Build Prompt (§18)

> **How to use this file.**
> 1. Save it as `docs/experience-layer.md` in the project.
> 2. Add one line to `CLAUDE.md` under a new heading `## 18. Experience Layer`: *"See `docs/experience-layer.md`. Tier 1 items are part of the M2–M4 Definitions of Done. Tier 2 and Tier 3 are explicitly out of scope until instructed."*
> 3. When starting a Claude Code session, paste the **Kickoff Instruction** at the bottom of this file.

---

## 0. Intent

The portal must feel like a **mentorship companion, not an administrative system**. Every feature below exists to answer one of three user questions instantly: *Where am I in the journey? What should I do next? Can the system do the tedious part for me?* If a feature doesn't answer one of those, it waits.

Non-negotiable experience principles (apply to every screen, every tier):

- **Mobile-first.** Most users are on phones. Big touch targets, short forms split into steps, no wide tables on mobile (use cards), fast load, low data usage. Test every Tier 1 feature on a 360px viewport before calling it done.
- **Never lose work.** Every form autosaves as a draft (goal form, session log, reviews, agreements, clinic submissions). Closing the browser must never destroy input.
- **AI does the tedious part; the human stays in control.** Rough notes in → clean structured output, as an editable suggestion. Same human-gating rule as CLAUDE.md rule 5.
- **Bilingual everywhere.** Every text area gets translate-to-EN / translate-to-FR / view-original, persisted via the `translations` cache. French users never forced into English.
- **Quiet, useful notifications.** Right message, right moment, right channel. Batch where possible. Never spam.
- **Clean UI rules:** cards over long tables, progress bars over numbers, step-by-step flows over giant forms, friendly empty states, status colors (green/yellow/red), simple language, filters + search on every list.

---

## TIER 1 — Build into M2–M4 (these are now part of the milestone DoDs)

### 1.1 Personalized role dashboards (replaces the generic dashboards in CLAUDE.md §12)

Each role's home screen answers "what matters to me right now," above the fold:

- **Mentee:** my mentor (card with photo, language, next meeting), current goals with progress bars, pending action items, next meeting, upcoming clinic, weekly tip, AI suggestion for next meeting, overall journey progress %.
- **Mentor:** my mentees (cards), pending goal reviews (count + deep link), next meetings, session logs awaiting completion, "mentees who need attention" (from risk monitor), AI-recommended discussion questions, review deadlines.
- **Admin:** active pairs, unmatched participants, inactive pairs, training progress, goals submitted, reviews completed, clinic attendance, at-risk pairs, programme health score.

### 1.2 Mentorship Journey Tracker

A persistent visual roadmap of the 9-month journey, shown on every dashboard:

`Profile → Training → Matched → Confidentiality agreement → Goals submitted → Monthly sessions → Mid-term review → Final review → Completion certificate`

Each step shows one of four states: **Completed / Pending / Overdue / Needs action**, computed from real data (not manually set). Tapping a step deep-links to the relevant page. Store as a derived `journey_state` computed server-side per user — no separate table needed; compute from existing records.

### 1.3 "What should I do next?" button

A single button on every dashboard. On tap, the server assembles the user's live state (journey step, overdue items, pending reviews, unscheduled meetings, mentor comments awaiting response) and the AI returns **one prioritized next action in one or two sentences**, with a deep link.

Examples of the expected output quality:
- Mentee: "Review your mentor's comments on Goal 2, then schedule your next session before Friday." → [Open Goal 2]
- Mentor: "You have 2 pending session logs and 1 goal waiting for review." → [Review goal]
- Admin: "12 mentees haven't submitted goals; 4 pairs haven't met in 30 days." → [View at-risk pairs]

Implementation: a server action `getNextBestAction(userId)` that builds a compact state summary and calls the AI adapter with a strict output schema. Cache for 10 minutes. Never hallucinate items not in the state summary — the prompt must instruct the model to choose only from the provided facts.

### 1.4 AI session summary from rough notes (extends CLAUDE.md §9.3)

The session log form gets a "rough notes" mode: the user types (or pastes) messy notes like *"discussed presentation skills, confidence, stakeholder engagement. mentee will prep short presentation before next session"* and the AI converts to the structured log: clean summary, competency discussed, action items (task/owner/due), next steps, timeline, risk flag if warranted, suggested next-meeting agenda. All fields land **editable** — the human confirms before save.

### 1.5 AI meeting preparation

Before each scheduled session, both participants can open a "Prepare" view that generates: suggested agenda, previous session summary, pending action items, goals to review, suggested questions (drawn from the Mentor Guide's questioning tips), challenges to discuss, recommended resources. Generated on demand, cached per meeting.

### 1.6 Action Item Tracker

First-class action items (already in schema as `action_items`): task, owner, due date, status (Not started / In progress / Completed / Blocked), related goal, notes. AI extracts them from session notes (1.4); users can add manually. Overdue items surface on dashboards and in "what next?".

### 1.7 Goal progress visualization

Goals move through stages: **Drafted → Mentor reviewed → Approved → In progress → Evidence submitted → Achieved.** Show a progress bar + stage timeline per goal. Mentees can **upload evidence** (presentation, certificate, supervisor feedback, work sample, reflection — via existing storage with signed URLs). Mentor feedback attaches per stage.

### 1.8 Pair Contract Page (the pair's shared workspace)

One page per matched pair containing everything they share: both agreements, meeting frequency + preferred contact method, goals, session logs, action items, review forms, shared resources, and the DM thread entry point. This becomes their home base — link to it from both dashboards.

### 1.9 Quick Actions menu

A floating "+" button (mobile especially): Schedule meeting · Add session log · Submit goal · Ask AI · Translate text · Request support · Join clinic · Add reflection. Each opens the shortest possible flow.

### 1.10 Smart notifications

In-app + email for: profile incomplete, match ready, goal commented, session log due, review due, clinic tomorrow, meeting reminder. Rules: batch into a daily digest where items aren't time-critical; per-user notification preferences; respect language preference; deep links in every notification. WhatsApp/SMS/Teams channels stay behind the existing feature flag (Tier 2 activates them).

### 1.11 Drafts everywhere + onboarding tour + help center

- **Autosave drafts** on all major forms (debounced, server-persisted, "resume where you left off" banner).
- **First-login guided tour** per role (mentor: profile → match → agreement → goals → first meeting → logs; mentee: profile → mentor → agreement → goals → meeting → reflections). Dismissible, never shown again unless re-requested.
- **Help Center**: short articles per topic (how matching works, submitting goals, scheduling, session logs, clinics, reviews, translation, requesting support), searchable, bilingual.

### 1.12 Calendar with write integration

Month / week / list views showing training, sessions, clinics, review deadlines, programme milestones. **Write, not just read:** when a session is scheduled, push the event to the participants' Outlook (Microsoft Graph) — at Dangote, if it isn't in Outlook it doesn't exist. Use the existing `MeetingProvider` abstraction; full Zoom join-link wiring still lands in M5.

### 1.13 Anonymous support request

"Request Support Privately" from any dashboard. Reasons: can't reach mentor/mentee · need goal-setting help · uncomfortable with match · need admin intervention · communication issue · language support · other. Routes to a private admin queue; admin responds privately; fully audited; requester identity visible to admins only (it's anonymous to other participants, not to the programme team — state this clearly in the UI).

### 1.14 Session no-show capture

When a meeting passes without a session log, prompt both participants with one tap: "Did this meeting happen?" If no → reason (mentor cancelled / mentee cancelled / forgot / rescheduled). Feeds the heatmap and risk monitor with *why*, not just *that*.

### 1.15 Offline-resilient session logging (mobile)

Session log and reflection forms must tolerate bad connectivity: local draft persistence, queued submit with retry, clear "saved locally / synced" indicator. Plant locations and low-bandwidth regions are a primary user context. (Full offline-first PWA is out of scope; resilient forms are in scope.)

### 1.16 Reflection journal (mentee) + private notes (mentor)

- **Mentee reflection journal:** private by default; post-session prompts (What did I learn? What action will I take? What challenge remains? What feedback did I receive? What support do I need?). Mentee can share individual entries with their mentor explicitly.
- **Mentor private notes per mentee:** observations, strengths, growth areas, follow-ups, next-session ideas. Private to the mentor; never visible to admins or the mentee. Both stored with the same confidentiality posture as DMs (metadata only to the risk monitor).

### 1.17 First-session icebreaker generator

When a pair is activated, generate a personalized first-meeting guide from both profiles: shared interests, suggested opening questions, what the mentee said they want to learn, what the mentor said they can offer, a light agenda. Attached to the Pair Contract Page and the first meeting's Prepare view. Small feature, outsized relationship payoff.

---

## TIER 2 — Post-pilot (after the M2 audit gate passes; slot into M3–M4 work)

- **2.1 Monthly pulse checks:** 3–4 question micro-surveys (mentee: met this month? useful? progressing? need support? · mentor: met? mentee engaged? goals clear? need admin help?). Feeds the health score and risk monitor. Sent via notification; answerable in two taps.
- **2.2 Mentorship Health Score per pair:** 0–100 from sessions completed, goal progress, action-item completion, review completion, meeting consistency, clinic participation, pulse responses. Green/Yellow/Red. Surfaces on admin dashboard and the engagement heatmap.
- **2.3 Mentorship Quality Score (distinct from activity):** derived from pulse + review responses — relationship comfort, goal clarity, session usefulness, feedback quality. Reported at cohort level to executives; per-pair only to admins.
- **2.4 Engagement heatmap:** pairs × months 1–9 grid, green/yellow/red per cell, fed by session logs + no-show reasons.
- **2.5 Admin intervention workflow:** every risk alert carries actions — send reminder, schedule check-in, message mentor/mentee, request update, mark resolved, open rematch review. All audited.
- **2.6 Re-matching workflow:** controlled flow with reason codes (language mismatch, availability, conflict of interest, engagement, mentor unavailable, mentee request, admin decision); preserves history; protects confidentiality; both parties notified appropriately.
- **2.7 WhatsApp as an interface (not just notifications):** users reply to a WhatsApp nudge ("Did you meet your mentor this week? Reply YES/NO") and the answer is logged as a pulse response. Behind the WhatsApp feature flag; requires WhatsApp Business API approval — start that approval now.
- **2.8 Smart resource recommendations:** AI recommends library resources based on the user's goals and recent challenges (e.g. communication goal → stakeholder-communication resource, feedback checklist). Resource library itself ships with categories, language tags, mentor/mentee targeting, save-for-later.
- **2.9 Built-in templates:** mentee (first-meeting agenda, goal template, monthly reflection, challenge summary, feedback reflection, final reflection), mentor (first-meeting guide, goal review checklist, feedback conversation guide, difficult conversation guide, monthly check-in, end-of-programme reflection), admin (programme report, clinic agenda, newsletter, attendance, completion report). One tap inserts the template into the relevant form.
- **2.10 Clinic challenge board with upvoting:** pre-clinic challenge submissions; participants upvote what resonates; facilitator sees a ranked board; AI groups by theme (extends the Clinic Assistant).
- **2.11 Recognition wall + success story bank:** "Mentorship Highlights" (Mentor/Mentee of the Month, Best Success Story, Most Consistent Pair, Most Improved) — admin-approved before anything is public. Success story form (challenge / what changed / mentorship's role / result / public-consent / name-hidden option); AI polishes rough stories for reports and newsletters; consent recorded.
- **2.12 Certificates:** auto-generated completion certificates (mentor, mentee, outstanding recognition, clinic participation, training completion) gated on completion criteria (training + agreement + goals + minimum sessions + both reviews). PDF, bilingual, verifiable ID.
- **2.13 Manager visibility (opt-in, consent-gated):** a mentee may grant their line manager a read-only high-level view — goals count + stage and journey progress only. Never session content, reflections, messages, or reviews. Explicit consent flow, revocable, audited.

---

## TIER 3 — Cohort 2 / later (do NOT build until explicitly instructed)

- **3.1 Light corporate gamification:** badges (Profile Completed, First Session, Goal Setter, Consistent Mentor, Active Mentee, Feedback Champion, Clinic Contributor, 3-Month Progress, Programme Finisher) and streaks. Professional visual treatment — this is an enterprise tool, not a game.
- **3.2 AI learning paths:** per-goal mini learning plans (week-by-week activities mixing resources, practice, and mentor sessions).
- **3.3 Voice notes:** record after a session → AI transcribes, summarizes, translates. Valuable for busy mentors; heavy on infra — later.
- **3.4 AI-powered natural-language search:** "Where is my next meeting?" "Summarize my progress." "Which mentees haven't submitted reviews?" Answers grounded strictly in the user's own permitted data.
- **3.5 Cohort-over-cohort benchmarking:** 2027 vs 2026 on completion, engagement, quality scores. (Note for now: keep all analytics queries cohort-parameterized so this is cheap later.)
- **3.6 Exit interview for dropouts:** a short, kind flow when someone leaves the programme (what made you stop? what would have helped?). Feeds the final report and next-cohort design.
- **3.7 AI final impact report:** full programme report (overview, numbers, matching summary, training, goal themes, engagement, review + clinic insights, success stories, challenges, recommendations) — admin edits, exports PDF/Word. Builds on the M3 Review Assistant.

---

## Guardrails for this layer

- Tier boundaries are hard: Tier 1 only until told otherwise. Flag, don't build, anything from Tier 2/3 that seems tempting.
- Reflection journals, mentor private notes, and DMs share one confidentiality posture: content private, metadata-only to the risk monitor, any override policy OFF by default and logged.
- Every AI surface in this layer is grounded in the user's actual data passed server-side — no client-side AI calls, no fabricated state, strict output schemas.
- "What next?", journey state, and health scores must be **computed from real records**. If the data isn't there to compute it, build the data capture first.
- Recognition, success stories, and manager visibility all require explicit recorded consent before anything is shown beyond the owner.
- Performance budget: dashboards interactive < 2s on a mid-range Android over 3G-class connection. Paginate, cache, and keep payloads small.

---

## Kickoff Instruction (paste this into Claude Code)

Read CLAUDE.md fully, then read docs/experience-layer.md fully. Audit the current codebase and report what exists, what's partial, and what's missing — both against the current milestone and against Experience Layer Tier 1. Do not build anything yet.

Then propose a build order for the Tier 1 items that fits the current milestone, sequenced so that data capture lands before anything computed from it (e.g. action items and no-show capture before "what next?" and the journey tracker). Wait for my approval before implementing. Tier 2 and Tier 3 are out of scope — do not scaffold them.
