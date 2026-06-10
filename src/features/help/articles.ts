// Help Center article registry (experience-layer.md §1.11). Content is static and
// bilingual, stored in the i18n catalogue under `help.articles.<slug>` (title,
// summary, and a `body` array of paragraphs) — no DB needed. Only topics whose
// features exist today are listed; clinics (M4) and reviews (M3) join when they
// ship, so the Help Center never documents a screen that isn't there.

export const HELP_SLUGS = [
  'matching',
  'goals',
  'scheduling',
  'sessions',
  'journal',
  'translation',
  'support',
] as const;

export type HelpSlug = (typeof HELP_SLUGS)[number];

export function isHelpSlug(value: string): value is HelpSlug {
  return (HELP_SLUGS as readonly string[]).includes(value);
}
