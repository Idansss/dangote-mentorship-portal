'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ActionItemStatus } from '@prisma/client';
import { updateActionItemStatus } from '@/features/sessions/actions';

const STATUSES = Object.values(ActionItemStatus);

// Status control for an action item (experience-layer.md §1.6). Editable by the
// assignee or the pair's mentor; changing the select submits immediately.
export function ActionItemStatusControl({
  itemId,
  status,
  canEdit,
}: {
  itemId: string;
  status: ActionItemStatus;
  canEdit: boolean;
}) {
  const t = useTranslations('sessions');
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!canEdit) {
    return <span className="text-xs text-muted-foreground">{t(`itemStatus.${status}`)}</span>;
  }

  function onChange(next: string) {
    start(async () => {
      const fd = new FormData();
      fd.set('itemId', itemId);
      fd.set('status', next);
      await updateActionItemStatus(fd);
      router.refresh();
    });
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t('status')}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`itemStatus.${s}`)}
        </option>
      ))}
    </select>
  );
}
