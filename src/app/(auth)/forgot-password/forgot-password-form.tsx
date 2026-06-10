'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { requestPasswordReset, type ForgotPasswordState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    requestPasswordReset,
    {},
  );

  // Same confirmation whether or not the address exists (no account enumeration).
  if (state.status === 'sent') {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t('forgotSent')}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.status === 'invalid' || state.status === 'rate_limited' ? (
        <p role="alert" className="text-sm text-destructive">
          {state.status === 'rate_limited' ? t('tooManyAttempts') : t('invalid')}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t('forgotSubmit')}
      </Button>
    </form>
  );
}
