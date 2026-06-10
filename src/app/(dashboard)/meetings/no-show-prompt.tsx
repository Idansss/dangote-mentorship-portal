'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NoShowReason } from '@prisma/client';
import { reportMeetingOutcome } from '@/features/meetings/actions';
import { Button } from '@/components/ui/button';

const REASONS = Object.values(NoShowReason);

// One-tap "Did this meeting happen?" capture (experience-layer.md §1.14).
// "Yes" submits immediately; "No" reveals the reason picker, then submits.
export function NoShowPrompt({ meetingId }: { meetingId: string }) {
  const t = useTranslations('meetings');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [askReason, setAskReason] = useState(false);

  function submit(happened: 'yes' | 'no', reason?: NoShowReason) {
    start(async () => {
      const fd = new FormData();
      fd.set('meetingId', meetingId);
      fd.set('happened', happened);
      if (reason) fd.set('reason', reason);
      await reportMeetingOutcome(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-medium">{t('didItHappen')}</p>
      {!askReason ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => submit('yes')} disabled={pending}>
            {t('yesHappened')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setAskReason(true)} disabled={pending}>
            {t('noDidnt')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`reason-${meetingId}`}>
            {t('reason')}
          </label>
          <select
            id={`reason-${meetingId}`}
            defaultValue=""
            disabled={pending}
            onChange={(e) => {
              if (e.target.value) submit('no', e.target.value as NoShowReason);
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="" disabled>
              {t('chooseReason')}
            </option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`reasonOption.${r}`)}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAskReason(false)} disabled={pending}>
            {t('back')}
          </Button>
        </div>
      )}
    </div>
  );
}
