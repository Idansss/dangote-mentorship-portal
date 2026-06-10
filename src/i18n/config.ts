// Supported interface locales (CLAUDE.md §2, §14: full EN/FR UI).
export const locales = ['en', 'fr'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

// Cookie that persists the user's chosen interface language.
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === 'en' || value === 'fr';
}
