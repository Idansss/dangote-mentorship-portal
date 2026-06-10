'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { revokeInviteForm, type RevokeInviteState } from '@/features/invites/form-actions';
import { Button } from '@/components/ui/button';

export function InviteRevokeButton({ inviteId }: { inviteId: string }) {
  const t = useTranslations('invites');
  const tc = useTranslations('common');
  const [state, action, pending] = useActionState<RevokeInviteState, FormData>(
    revokeInviteForm,
    null,
  );

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={inviteId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {t('revoke')}
      </Button>
      {state && !state.ok ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {tc('errorBody')}
        </p>
      ) : null}
    </form>
  );
}
