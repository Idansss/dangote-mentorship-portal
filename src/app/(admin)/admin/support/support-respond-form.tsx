'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SupportRequestStatus } from '@prisma/client';
import {
  respondToSupportRequestForm,
  type SupportActionState,
} from '@/features/support/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const STATUSES = [
  SupportRequestStatus.OPEN,
  SupportRequestStatus.IN_PROGRESS,
  SupportRequestStatus.RESOLVED,
] as const;

// Admin response + status control for one support request (§1.13). The response
// is shown back to the requester on their /support page.
export function SupportRespondForm({
  requestId,
  status,
  initialResponse,
}: {
  requestId: string;
  status: SupportRequestStatus;
  initialResponse: string;
}) {
  const t = useTranslations('support');
  const tc = useTranslations('common');
  const router = useRouter();
  const [state, action, pending] = useActionState<SupportActionState, FormData>(
    respondToSupportRequestForm,
    null,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-2 border-t pt-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="space-y-1">
        <Label htmlFor={`resp-${requestId}`}>{t('responseLabel')}</Label>
        <Textarea
          id={`resp-${requestId}`}
          name="adminResponse"
          maxLength={4000}
          defaultValue={initialResponse}
          placeholder={t('responseHint')}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`status-${requestId}`} className="text-xs">
            {tc('status')}
          </Label>
          <select
            id={`status-${requestId}`}
            name="status"
            defaultValue={status}
            className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? tc('loading') : t('saveResponse')}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'VALIDATION' ? tc('errorBody') : state.error.message}
        </p>
      ) : null}
    </form>
  );
}
