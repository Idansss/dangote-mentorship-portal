import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LogIn } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { isEntraConfigured } from '@/lib/auth/entra';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  // Already signed in → go straight to the role-correct dashboard.
  const user = await getCurrentUser();
  if (user) redirect(defaultDashboardPath(user.roles));

  const t = await getTranslations('auth');
  return (
    <Card className="w-full max-w-md rounded-[1.5rem] shadow-elevation-lg">
      <CardHeader className="space-y-3">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-light to-green text-white shadow-glow">
          <LogIn className="size-5" />
        </span>
        <CardTitle className="font-display text-h1">{t('loginTitle')}</CardTitle>
        <CardDescription>{t('loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <LoginForm entraEnabled={isEntraConfigured()} />
        <div className="border-t border-border pt-4 text-center text-small text-ink-2">
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-medium text-green-strong hover:underline">
            {t('signupLink')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
