'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getNextBestAction } from '@/features/next-action/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AIContainer } from '@/components/ai-container';

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
          <p className="text-body font-medium text-ink">{t('prompt')}</p>
          <Button type="button" size="sm" onClick={run} disabled={pending}>
            {pending ? t('thinking') : result ? t('again') : t('cta')}
          </Button>
        </div>

        {result ? (
          <AIContainer title={t('prompt')}>
            <p>{result.message}</p>
            <Link href={result.link} className="mt-2 inline-block font-medium text-info hover:underline">
              {t('open')} →
            </Link>
          </AIContainer>
        ) : null}

        {error ? <p className="text-small text-risk">{t('error')}</p> : null}
      </CardContent>
    </Card>
  );
}
