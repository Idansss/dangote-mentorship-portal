'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { generateIcebreaker } from '@/features/icebreaker/actions';
import { Button } from '@/components/ui/button';

// Triggers on-demand icebreaker generation (§1.17) and refreshes to show the
// cached guide. Disabled when AI isn't configured — the profile-built guide shows.
export function IcebreakerButton({
  menteeId,
  hasCache,
  aiEnabled,
}: {
  menteeId: string;
  hasCache: boolean;
  aiEnabled: boolean;
}) {
  const t = useTranslations('icebreaker');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    const fd = new FormData();
    fd.set('menteeId', menteeId);
    startTransition(async () => {
      await generateIcebreaker(fd);
      router.refresh();
    });
  }

  if (!aiEnabled) {
    return <p className="text-xs text-muted-foreground">{t('aiOff')}</p>;
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={run} disabled={pending}>
      {pending ? t('generating') : hasCache ? t('regenerate') : t('generate')}
    </Button>
  );
}
