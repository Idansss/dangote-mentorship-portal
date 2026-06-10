'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getNextBestAction } from '@/features/next-action/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "What should I do next?" button on every dashboard (experience-layer.md §1.3).
// One tap asks the server for the single most important next action (grounded in
// real records, AI-phrased) and shows it with a deep link.
interface Result {
  message: string;
  link: string;
}

export function NextActionButton() {
  const t = useTranslations('nextAction');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);

  function run() {
    setError(false);
    startTransition(async () => {
      const res = await getNextBestAction();
      if (res.ok) {
        setResult({ message: res.data.message, link: res.data.link });
      } else {
        setError(true);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{t('prompt')}</p>
          <Button type="button" size="sm" onClick={run} disabled={pending}>
            {pending ? t('thinking') : result ? t('again') : t('cta')}
          </Button>
        </div>

        {result ? (
          <div className="rounded-md bg-accent p-3 text-sm">
            <p>{result.message}</p>
            <Link href={result.link} className="mt-2 inline-block font-medium text-primary hover:underline">
              {t('open')} →
            </Link>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-700">{t('error')}</p> : null}
      </CardContent>
    </Card>
  );
}
