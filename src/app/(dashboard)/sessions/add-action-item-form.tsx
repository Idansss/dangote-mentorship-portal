'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { addActionItemForm, type SessionActionState } from '@/features/sessions/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mentor adds a follow-up action item to an existing session log (§1.6).
export function AddActionItemForm({ sessionLogId }: { sessionLogId: string }) {
  const t = useTranslations('sessions');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SessionActionState, FormData>(
    addActionItemForm,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="sessionLogId" value={sessionLogId} />
      <Input name="title" required maxLength={300} placeholder={t('taskPlaceholder')} className="min-w-[12rem] flex-1" aria-label={t('task')} />
      <select name="assignee" defaultValue="mentee" aria-label={t('owner')} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
        <option value="mentee">{t('owner_mentee')}</option>
        <option value="mentor">{t('owner_mentor')}</option>
        <option value="none">{t('owner_none')}</option>
      </select>
      <Input type="date" name="due" aria-label={t('dueDate')} className="w-auto" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {t('addActionItem')}
      </Button>
    </form>
  );
}
