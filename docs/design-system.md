# Dangote Mentorship Portal — Design System (§19)

> **How to use this file.**
> 1. Save as `docs/design-system.md`.
> 2. Add to `CLAUDE.md`: `## 19. Design System — See docs/design-system.md. This governs ALL UI. Build the token file and shared component library FIRST, before any feature screen. No raw shadcn defaults; every component is themed to these tokens.`
> 3. Paste the **Kickoff Instruction** at the bottom when you start UI work in Claude Code.

---

## 0. Design thesis

This is not a generic mentorship SaaS. It is the operating system for **one** programme: Dangote's 9-month, bilingual, AI-assisted mentorship journey. The reference products (Boana, Mentorise, I-Mentor, Renaizant) are clean but interchangeable template kits — none is bilingual, none shows a journey, none was built for a mentor logging a session on a phone on a weak connection at a plant site. Our edge is that the UI is *purpose-built*, and it should look it.

**The look:** light, clean, corporate, confident — calm enough for an executive demo, effortless enough for daily use by 400+ people. **Green and white** as the identity. The personality comes from restraint, generous space, and one signature element done well — not from decoration.

**Spend boldness in one place:** the **Journey Rail** (§5). Everything else stays quiet and disciplined.

---

## 1. Palette (green & white)

A single, disciplined green system. One green does the heavy lifting; greys carry the structure; white is the canvas. Status colors are reserved strictly for status — never decoration.

```
--bg            #FFFFFF   page canvas
--surface       #F7F9F7   cards, raised panels (a barely-green off-white)
--surface-2     #EEF3EE   nested panels, table header rows
--border        #E2E8E2   hairlines, dividers, input borders
--ink           #14201A   primary text (near-black with a green undertone)
--ink-2         #4A5A50   secondary text, labels
--ink-3         #8A988F   muted text, placeholders, captions

--green         #1E7A46   PRIMARY brand green — buttons, active states, links
--green-strong  #155C34   hover/pressed, headings-on-green
--green-soft    #E4F1E9   selected rows, soft fills, chip backgrounds
--green-ring    #1E7A4633 focus ring (green at 20% alpha)

--gold          #B5862A   recognition / certificates / highlights ONLY (used sparingly, the one warm accent)

# Status (functional, not decorative)
--ok            #1E7A46   green   — healthy / completed / on track
--warn          #C77A12   amber   — needs attention / pending / due soon
--risk          #C0392B   red     — at risk / overdue / blocked
--info          #2C6E8F   blue    — informational, AI suggestions
```

**Rules:** Default to greyscale + white. Green appears for brand, primary action, and "good" status. Amber/red appear *only* on real status. Gold appears *only* on recognition and certificates. If a screen has more than the primary green + one status color visible at once, something is being decorated that shouldn't be. Dark mode is out of scope for v1 — design light, build the tokens so a dark theme is possible later.

---

## 2. Typography

Avoid the default system-font look the reference kits all have. Two faces, both free and self-hostable (works offline / low-bandwidth):

- **Display / headings:** **Fraunces** (optical serif) for page titles, section headers, the welcome line, big numbers, certificate text. It gives the warm, human, "this programme is about people" feel that distinguishes us from cold dashboard kits. Use it with restraint — headings only.
- **Body / UI:** **Inter** for everything functional — body, labels, buttons, tables, forms, data.

Type scale (don't deviate):

```
Display   Fraunces  36/44  weight 500   page titles, certificates
H1        Fraunces  28/36  weight 500   section headers
H2        Inter     20/28  weight 600   card titles
H3        Inter     16/24  weight 600   sub-labels
Body      Inter     15/24  weight 400   default text
Small     Inter     13/20  weight 400   captions, helper text
Micro     Inter     11/16  weight 600   uppercase eyebrows, status pills (tracking +0.04em)
```

Sentence case everywhere (never Title Case On Buttons). Numbers in stat tiles use Inter tabular figures so they don't jitter.

---

## 3. Layout & spacing

- **8px spacing system.** Gaps, padding, radii all multiples of 4/8. Card padding 24. Section gap 32.
- **Radii:** 12px cards, 8px inputs/buttons, 999px pills/avatars. Consistent — no mixed rounding.
- **Shadows:** one soft elevation only — `0 1px 2px rgba(20,32,26,.04), 0 4px 16px rgba(20,32,26,.06)`. No heavy drop shadows, no neumorphism.
- **Shell:** left sidebar nav (collapsible to icons), top bar with search + language toggle + notifications + profile, content area max-width ~1280 with comfortable gutters. On mobile the sidebar becomes a bottom tab bar with the 4–5 primary destinations.
- **Cards over tables.** Reference kits lean on dense tables; we use cards for anything a person reads, tables only for true admin data grids (and those collapse to cards on mobile).
- **Friendly empty states** everywhere: a one-line plain-language prompt + the action that fills it. Never a blank panel.

---

## 4. Core components (build these first, theme every shadcn primitive to the tokens)

Button (primary green / secondary outline / ghost / destructive), Input + Textarea (with the bilingual control, §6), Select, Card, StatTile, Pill/Badge (status variants), Avatar + AvatarGroup, Tabs, Table (sortable, paginated, mobile-collapsing), Dialog, Drawer (mobile forms), Toast, ProgressBar, ProgressRing, Tooltip, Calendar, FloatingActionButton (§ quick actions), SkeletonLoader, EmptyState. Plus the three signature components below (§5–§7).

Every interactive element: visible green focus ring (`--green-ring`), 44px minimum touch target, keyboard-operable, `prefers-reduced-motion` respected.

---

## 5. SIGNATURE element — the Journey Rail

The one thing this product is remembered by, and the thing no reference kit has. A horizontal (desktop) / vertical (mobile) 9-step rail, persistent on every dashboard:

`Profile · Training · Matched · Agreement · Goals · Sessions · Mid-term review · Final review · Certificate`

- Each node is a small circle connected by a line. State drives appearance:
  - **Completed** — filled green, check.
  - **Current** — green ring, subtle pulse (respect reduced-motion: no pulse, use a heavier ring).
  - **Pending** — hollow grey.
  - **Overdue / needs action** — amber or red ring + a small dot badge.
- The connecting line fills green up to the current step — a literal progress line across the 9 months.
- Each node is tappable → deep-links to that step's screen. Hover/tap shows a tooltip: step name + status + the one action ("Submit your goals →").
- This is where the Fraunces/green identity concentrates. Make it beautiful: smooth fill animation on load (once), crisp states, perfect alignment. It should be the screenshot that sells the product.

---

## 6. SIGNATURE behavior — bilingual everywhere

No reference product has this; it's core to ours. Every user-generated text field (goals, session notes, reflections, clinic questions, messages, reviews) carries an inline control:

```
┌───────────────────────────────────────────────┐
│ [textarea]                                       │
│                                                  │
│  🌐 EN | FR      View original · View translated │
└───────────────────────────────────────────────┘
```

- A global EN/FR toggle in the top bar switches the whole interface (next-intl).
- Per-field: translate to the other language on demand, cached, with "view original / view translated" never destroying the source. French users write French; the toggle is for the reader, not a wall.
- Show the original-language tag quietly on any translated content ("translated from French").

---

## 7. SIGNATURE behavior — AI as a native citizen

AI affordances look intentional, never bolted-on. One consistent visual language: a small `--info` blue spark/AI glyph, a light blue-tinted container for AI output, and always an **editable** result the human confirms.

- **"What should I do next?"** — a pill button on every dashboard; result appears as one calm sentence + a deep-link, not a chat bubble.
- **"Summarize my notes"** on the session log — rough notes → structured fields, all editable.
- **"Prepare for this session"** — generates the agenda card.
- AI suggestions are visually distinct (blue tint) from committed data (neutral) so people always know what's a draft.

---

## 8. Screen-level direction (so it beats the references, not copies them)

- **Mentee/Mentor home:** Journey Rail across the top → "what next?" + next meeting as the two hero cards → goals with progress rings → upcoming clinic + weekly tip. Calm, scannable, one screen. (Mentorise has the visual energy; we add purpose.)
- **Admin home:** stat tiles row (pairs, unmatched, at-risk, health score) → engagement heatmap (we do I-Mentor's heatmap, in our green) → at-risk pairs list with one-tap interventions → programme health ring. Dense but ordered.
- **Pairs view (admin):** Renaizant's timeline is the right idea — mentors as rows, engagement as bars across the 9 months — rebuilt in our system. This is the admin's power screen.
- **Pair Contract Page:** the pair's calm shared home — agreements, goals, logs, action items, messages — in cards, not a table.
- **Session log (mobile):** the make-or-break screen. Three fields + "summarize my notes," big touch targets, autosave, works offline. If this is fast on a phone on bad network, the product wins.

---

## 9. Quality floor (non-negotiable)

Responsive to 360px · visible keyboard focus on everything · reduced-motion respected · WCAG 2.2 AA contrast (the greens above are checked against white/ink for AA) · skeleton loaders not spinners · optimistic UI with clear saved/syncing states · self-hosted fonts · no layout shift. Take the Chanel rule into every screen: build it, then remove one thing.

---

## Kickoff Instruction (paste into Claude Code)

Read CLAUDE.md, docs/experience-layer.md, and docs/design-system.md fully.

Before building any feature screen, do this in order:
1. Create the design token layer (CSS variables + Tailwind theme extension) from §1–§3 exactly. Self-host Fraunces and Inter.
2. Build and theme the core component library from §4 — every shadcn primitive restyled to the tokens. Show me these in a single component-preview route first.
3. Build the three signature components: Journey Rail (§5), the bilingual field control (§6), and the AI-output container (§7).
4. Only then assemble dashboards and feature screens, deriving every color, radius, and type choice from the tokens — no ad-hoc values, no raw defaults.

Stop after step 2 and show me the component preview before going further. Do not restyle anything outside this spec without flagging it first.
