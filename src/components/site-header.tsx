import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { signOutAction } from '@/lib/auth/actions';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Button } from '@/components/ui/button';

export async function SiteHeader() {
  const t = await getTranslations();
  const user = await getCurrentUser();

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
