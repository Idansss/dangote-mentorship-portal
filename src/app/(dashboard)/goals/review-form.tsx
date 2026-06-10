'use client';

import { useActionState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { reviewGoalForm, type GoalActionState } from '@/features/goals/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Mentor goal review (CLAUDE.md §7): comment, approve, or request changes.
// Approval is the human action that flips the goal's status.
export function ReviewForm({ goalId }: { goalId: string }) {
  const t = useTranslations('goals');
  const tc = useTranslations('common');
  const commentId = useId();
  const router = useRouter();
  const [state, action, pending] = useActionState<GoalActionState, FormData>(reviewGoalForm, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-2 border-t pt-3">
      <input type="hidden" name="goalId" value={goalId} />
      <div className="space-y-1">
        <Label htmlFor={commentId}>{t('reviewComment')}</Label>
        <Textarea id={commentId} name="comment" maxLength={2000} placeholder={t('reviewCommentHint')} />
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'VALIDATION' ? tc('errorBody') : state.error.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" size="sm" disabled={pending}>
          {t('approve')}
        </Button>
        <Button type="submit" name="decision" value="reject" size="sm" variant="outline" disabled={pending}>
          {t('requestChanges')}
        </Button>
        <Button type="submit" name="decision" value="comment" size="sm" variant="ghost" disabled={pending}>
          {t('commentOnly')}
        </Button>
      </div>
    </form>
  );
}
