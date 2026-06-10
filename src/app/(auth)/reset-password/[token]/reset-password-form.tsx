'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import type { ResetPasswordState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Action = (prev: ResetPasswordState, formData: FormData) => Promise<ResetPasswordState>;

export function ResetPasswordForm({ action }: { action: Action }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(action, {});

  const errorMessage = {
    invalid: t('resetInvalid'),
    rate_limited: t('tooManyAttempts'),
    validation: tc('errorBody'),
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage[state.error]}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t('resetSubmit')}
      </Button>
    </form>
  );
}
