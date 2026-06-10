import { getTranslations } from 'next-intl/server';

// Root Suspense fallback. Uses the translated string so French users never see
// hardcoded English (CLAUDE.md §16); the other global states (error/not-found)
// are already localized.
export default async function Loading() {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      <span className="animate-pulse">{t('loading')}</span>
    </div>
  );
}
