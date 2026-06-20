'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    // Server-side errors are captured by Sentry via src/instrumentation.ts;
    // client capture is a follow-up via Sentry's withSentryConfig (H2).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">{t('errorTitle')}</h2>
      <p className="max-w-md text-muted-foreground">{t('errorBody')}</p>
      <Button onClick={reset}>{t('back')}</Button>
    </div>
  );
}
