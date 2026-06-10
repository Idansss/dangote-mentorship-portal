import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { signOutAction } from '@/lib/auth/actions';
import { getUnreadCount } from '@/lib/notifications/data';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export async function SiteHeader() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const unread = user ? await getUnreadCount(user.id) : 0;

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-primary">
          {t('common.appName')}
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            {t('nav.about')}
          </Link>
          <Link href="/faq" className="text-muted-foreground hover:text-foreground">
            {t('nav.faq')}
          </Link>

          <LocaleSwitcher />

          {user ? (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href={defaultDashboardPath(user.roles)}>{t('nav.dashboard')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/pair">{t('nav.pair')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/goals">{t('nav.goals')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/sessions">{t('nav.sessions')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/meetings">{t('nav.meetings')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/calendar">{t('nav.calendar')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/journal">{t('nav.journal')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/agreements">{t('nav.agreements')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/support">{t('nav.support')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/help">{t('nav.help')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/mid-term-review">{t('nav.midTermReview')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/final-review">{t('nav.finalReview')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/notifications" className="flex items-center gap-1">
                  {t('nav.notifications')}
                  {unread > 0 ? (
                    <Badge variant="secondary" aria-label={t('notifications.unreadCount', { count: unread })}>
                      {unread}
                    </Badge>
                  ) : null}
                </Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" size="sm" variant="outline">
                  {t('common.signOut')}
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
