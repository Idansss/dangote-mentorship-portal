'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { generateMeetingPrep } from '@/features/meetings/actions';
import { Button } from '@/components/ui/button';

// Triggers on-demand AI prep generation (§1.5) and refreshes to show the cached
// result. Disabled when AI isn't configured — the static prep is shown instead.
export function GenerateButton({
  meetingId,
  hasCache,
  aiEnabled,
}: {
  meetingId: string;
  hasCache: boolean;
  aiEnabled: boolean;
}) {
  const t = useTranslations('prepare');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    const fd = new FormData();
    fd.set('meetingId', meetingId);
    startTransition(async () => {
      await generateMeetingPrep(fd);
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
