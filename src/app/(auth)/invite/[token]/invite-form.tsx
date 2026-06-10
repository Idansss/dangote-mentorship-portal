'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import type { AcceptInviteState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Action = (prev: AcceptInviteState, formData: FormData) => Promise<AcceptInviteState>;

export function InviteForm({ action, email }: { action: Action; email: string }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [state, formAction, pending] = useActionState<AcceptInviteState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{tc('appName')}</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error === 'invalid' ? t('inviteInvalid') : tc('errorBody')}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t('inviteAccept')}
      </Button>
    </form>
  );
}
