'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { login, type LoginState } from './actions';
import { signInWithEntra } from '@/lib/auth/actions';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { cn } from '@/lib/utils';

// Login form (Stitch redesign — docs/stitch-redesign.md). Matches the Stitch
// Login card: bilingual toggle → SSO → "or use credentials" divider → email +
// password (icon-prefixed, password reveal) → remember-me → Sign In. The SSO
// button uses the portal's real provider (Microsoft Entra), shown only when
// configured — we don't render a dead Google Workspace button.
export function LoginForm({ entraEnabled }: { entraEnabled: boolean }) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  const fieldShell =
    'relative flex items-center rounded-md border border-border bg-surface transition-all focus-within:border-green-light focus-within:ring-2 focus-within:ring-green-light/15';
  const fieldInput =
    'w-full bg-transparent py-2.5 pl-11 pr-4 text-body text-ink placeholder:text-ink-3 focus:outline-none';

  return (
    <div>
      {/* Bilingual toggle */}
      <div className="mb-5 flex justify-end">
        <LocaleSwitcher />
      </div>

      {/* SSO */}
      {entraEnabled ? (
        <>
          <form action={signInWithEntra}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-body font-medium text-ink transition-all hover:bg-surface-2 active:scale-[0.98]"
            >
              <Building2 className="size-5 text-green" />
              {t('dangoteSso')}
            </button>
          </form>

          <div className="relative my-7">
            <div aria-hidden className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-4 text-micro uppercase tracking-wider text-ink-2">
                {t('orCredentials')}
              </span>
            </div>
          </div>
        </>
      ) : null}

      {/* Credentials */}
      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="ml-1 text-micro uppercase tracking-wider text-ink-2">
            {t('corporateEmail')}
          </label>
          <div className={fieldShell}>
            <Mail className="pointer-events-none absolute left-3 size-5 text-ink-3" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t('emailPlaceholder')}
              className={fieldInput}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="password" className="text-micro uppercase tracking-wider text-ink-2">
              {t('password')}
            </label>
            <Link href="/forgot-password" className="text-micro text-green-light hover:underline">
              {t('forgotShort')}
            </Link>
          </div>
          <div className={fieldShell}>
            <Lock className="pointer-events-none absolute left-3 size-5 text-ink-3" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className={cn(fieldInput, 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 text-ink-3 transition-colors hover:text-green-strong"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <label className="ml-1 flex items-center gap-2 text-small text-ink-2">
          <input
            type="checkbox"
            name="remember"
            className="size-4 rounded border-border text-green focus:ring-green-light"
          />
          {t('rememberMe')}
        </label>

        {state.error ? (
          <p role="alert" className="text-small text-risk">
            {state.error === 'rate_limited' ? t('tooManyAttempts') : t('invalid')}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-md bg-green py-3 text-h3 font-semibold text-white shadow-elevation transition-all hover:bg-green-strong active:scale-[0.98] disabled:opacity-60"
        >
          {t('submit')}
        </button>
      </form>
    </div>
  );
}
