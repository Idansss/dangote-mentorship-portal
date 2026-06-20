import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { isEntraConfigured } from '@/lib/auth/entra';
import { BrandMark } from '@/components/brand-logo';
import { Wordmark } from '@/components/wordmark';
import { LoginForm } from './login-form';

// Login (Stitch redesign — docs/stitch-redesign.md). Centered brand header → SSO
// + credentials card → request-access + legal footer, matching the Stitch Login
// screen. Auth wiring (Entra SSO, credentials, forgot-password) is preserved in
// LoginForm.
export default async function LoginPage() {
  // Already signed in → go straight to the role-correct dashboard.
  const user = await getCurrentUser();
  if (user) redirect(defaultDashboardPath(user.roles));

  const t = await getTranslations('auth');
  const tc = await getTranslations('common');

  return (
    <div>
      {/* Brand header */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 rounded-2xl bg-surface-2 p-3 shadow-elevation">
          <BrandMark className="size-14" />
        </div>
        <h1 className="text-center font-display text-h1 font-bold text-ink">
          <Wordmark name={tc('appShortName')} />
        </h1>
        <p className="mt-1 text-small text-ink-2">{t('enterprisePortal')}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevation transition-shadow hover:shadow-elevation-lg">
        <LoginForm entraEnabled={isEntraConfigured()} />
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center">
        <p className="text-small text-ink-2">
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-bold text-green-light hover:underline">
            {t('requestAccess')}
          </Link>
        </p>
        <div className="mt-4 flex justify-center gap-6 opacity-70">
          <Link href="/faq" className="text-micro text-ink-2 hover:text-green-strong">
            {t('privacyPolicy')}
          </Link>
          <Link href="/faq" className="text-micro text-ink-2 hover:text-green-strong">
            {t('termsOfService')}
          </Link>
          <Link href="/support" className="text-micro text-ink-2 hover:text-green-strong">
            {t('supportLink')}
          </Link>
        </div>
        <p className="mt-4 text-micro text-ink-3">{t('copyright')}</p>
      </footer>
    </div>
  );
}
