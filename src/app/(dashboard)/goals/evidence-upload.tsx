'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { uploadGoalEvidenceForm, type GoalActionState } from '@/features/goals/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Upload evidence of goal progress (experience-layer.md §1.7). Files are stored
// via the storage seam and served only through the authorized download route.
export function EvidenceUpload({ goalId }: { goalId: string }) {
  const t = useTranslations('goals');
  const tc = useTranslations('common');
  const fileId = useId();
  const noteId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState<GoalActionState, FormData>(
    uploadGoalEvidenceForm,
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
    <form ref={formRef} action={action} className="space-y-2 border-t pt-3">
      <input type="hidden" name="goalId" value={goalId} />
      <div className="space-y-1">
        <Label htmlFor={fileId}>{t('evidenceFile')}</Label>
        <Input
          id={fileId}
          name="file"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.txt"
        />
        <p className="text-xs text-muted-foreground">{t('evidenceHint')}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor={noteId}>{t('evidenceNote')}</Label>
        <Input id={noteId} name="note" maxLength={500} />
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error.message || tc('errorBody')}</p>
      ) : null}

      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? tc('loading') : t('uploadEvidence')}
      </Button>
    </form>
  );
}
