import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Ticket, Mail, UserPlus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InviteCodeForm } from './invite-code-form';

// Request-access page (invite-only model, CLAUDE.md §2). No self-service account
// creation: a visitor either activates an existing invite code (routes into the
// /invite/[token] flow) or asks an administrator for one.
export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(defaultDashboardPath(user.roles));

  const t = await getTranslations('signup');
  // Demo default: the seeded super-admin address. Swap for a real support inbox
  // (or a routed contact form) before the pilot.
  const requestHref =
    'mailto:admin@dangote.com?subject=Mentorship%20programme%20access%20request';

  return (
    <Card className="w-full max-w-md rounded-[1.5rem] shadow-elevation-lg">
      <CardHeader className="space-y-3">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-light to-green text-white shadow-glow">
          <UserPlus className="size-5" />
        </span>
        <CardTitle className="font-display text-h1">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Have an invite code */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-2/50 p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-green-soft text-green-strong">
              <Ticket className="size-4" />
            </span>
            <div>
              <p className="text-small font-semibold text-ink">{t('inviteTitle')}</p>
            </div>
          </div>
          <p className="text-small text-ink-2">{t('inviteHint')}</p>
          <InviteCodeForm />
        </div>

        {/* No invite yet */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-2/50 p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-info/10 text-info">
              <Mail className="size-4" />
            </span>
            <p className="text-small font-semibold text-ink">{t('requestTitle')}</p>
          </div>
          <p className="text-small text-ink-2">{t('requestHint')}</p>
          <Button asChild variant="outline" className="w-full">
            <a href={requestHref}>{t('requestCta')}</a>
          </Button>
        </div>

        <div className="border-t border-border pt-4 text-center text-small text-ink-2">
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-medium text-green-strong hover:underline">
            {t('signinLink')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
