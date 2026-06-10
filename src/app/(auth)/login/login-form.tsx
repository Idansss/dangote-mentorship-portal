'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { login, type LoginState } from './actions';
import { signInWithEntra } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ entraEnabled }: { entraEnabled: boolean }) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="space-y-4">
      {entraEnabled ? (
        <>
          <form action={signInWithEntra}>
            <Button type="submit" variant="outline" className="w-full">
              {t('entra')}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t('or')}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error === 'rate_limited' ? t('tooManyAttempts') : t('invalid')}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {t('submit')}
        </Button>
      </form>
    </div>
  );
}
