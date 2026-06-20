# Stitch Redesign — Source of Truth

This file records the Google Stitch redesign that the portal UI is being matched to.
Generated in the Stitch project **"Dangote Mentorship Portal"**
(`projects/10329190804299664621`). Design system asset:
`assets/9dcd3fea4a32472384f8d89e7d1e9f82`. Local copies of every screen (HTML +
screenshot) live in `/stitch-designs/`.

> The design replaces the original green identity (§19 design-system.md) with a
> **deep corporate teal** Material-3 system and **Public Sans**. Where this file
> conflicts with `docs/design-system.md`, this file wins for visual styling.

## Palette (Material 3 tokens → our tokens)

| Role | Stitch (M3) | Hex | Mapped to our token |
| --- | --- | --- | --- |
| Page background | surface / background | `#F8FAF9` | `--bg` |
| Card surface | surface-container-lowest | `#FFFFFF` | `--surface` |
| Nested panel | surface-container-low | `#F2F4F4` | `--surface-2` |
| Border / hairline | (slate) | `#E2E8F0` | `--border` |
| Primary text | on-surface | `#191C1C` | `--ink` |
| Secondary text | on-surface-variant | `#404849` | `--ink-2` |
| Muted text | outline | `#707979` | `--ink-3` |
| Brand accent | surface-tint | `#2A676C` | `--green-light` |
| **Primary action** | primary-container | `#004B50` | `--green` |
| Hover / pressed / active text | primary | `#003336` | `--green-strong` |
| Soft brand fill / chips | (light teal) | `#D9EBEC` | `--green-soft` |
| Recognition / certificates | tertiary-container | `#64381A` | `--gold` (kept warm) |
| Success | success emerald | `#1E7A46` | `--ok` |
| Warning | amber | `#C77A12` | `--warn` |
| Error / at-risk | error | `#BA1A1A` | `--risk` |
| **AI suggestions** | indigo-600 | `#4F46E5` | `--info` (AI container bg `#EEF2FF`) |

## Type

- **Public Sans** everywhere (headline + body + label). Self-hosted via next/font.
- Scale: headline-xl 40/48 700 · headline-lg 32/40 700 · headline-md 24/32 600 ·
  headline-sm 20/28 600 · body-lg 18/28 · body-md 16/24 · body-sm 14/20 ·
  label-md 12/16 600 +0.05em.

## Shape & depth

- Cards 16px radius · buttons 10px · pills/chips 999px.
- Soft ambient shadows (no heavy borders). AI container is the one tonal layer.

## Signature components (from Stitch markup)

- **Journey Rail:** 9 nodes, 2px connector; line fills `--green` to current step.
  Completed = filled teal circle + check. Current = teal ring + pulsing dot +
  ping halo. Future = grey hollow, 50% opacity. `STEP n OF 9` pill in
  primary-container.
- **AI container:** indigo (`#EEF2FF`) box, `✨ AI Suggested` header, italicized
  editable text, shimmer animation. Action button white w/ indigo border.
- **Bilingual control:** inline `EN | FR`, active = teal bold underline.

## Screens (Stitch screen id → portal route)

| Stitch title | screen id | route | local file |
| --- | --- | --- | --- |
| Public Marketing Home | 4c30281d39bb4199a223a3da369dca62 | `/` | 01-public-home |
| Login | 31d0eefca67c49bb8b2ece18bd4ee32c | `/login` | 02-login |
| Mentee Dashboard | f678904eaaca4885a136124f7bf5f1c5 | `/dashboard/mentee` | 03-mentee-dashboard |
| Mentor Dashboard | e43962b2af514b63a6d4ef1375d76252 | `/dashboard/mentor` | 04-mentor-dashboard |
| Goals Page | 601ab48e65cf4072bb46c9702ae4a591 | `/goals` | 05-goals |
| Pair/Contract Page | 007ec1f1e02e4afa868c0ce14fe89515 | `/pair` | 06-pair |
| Session Log (Mobile) | 1f6515cb3816466f8fda18b754d177b8 | `/sessions` | 07-session-mobile |
| Messages | 2a1d8c1f7e3c4c4d900d025d763beacb | `/messages` | 08-messages |
| Admin Dashboard | 4ceb040b092d4559ae43b0581d4f315d | `/admin` | 09-admin-dashboard |
| Matching Engine | 9858781f4c754bcebf2db3f330b7c444 | `/admin/matching` | 10-matching |
| Data Import & Validation | 98d75dca03bf4a53bb7814dd6846d7f4 | `/admin/imports` | 11-imports |

Icons in Stitch use **Material Symbols Outlined**; we keep **lucide-react**
equivalents in the React build.
