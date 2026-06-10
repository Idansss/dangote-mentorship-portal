import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { SiteHeader } from '@/components/site-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate (CLAUDE.md §3, §4): the admin area requires an admin role.
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!hasAnyRole(user, ADMIN_ROLES)) redirect('/dashboard');

  const t = await getTranslations('admin');
  const tImports = await getTranslations('imports');
  const tMatching = await getTranslations('matching');
  const tPeople = await getTranslations('people');
  const tInvites = await getTranslations('invites');
  const tSupport = await getTranslations('support');

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="container flex flex-1 gap-8 py-10">
        <aside className="w-48 shrink-0 space-y-1 text-sm">
          <Link href="/admin" className="block rounded px-3 py-2 hover:bg-accent">
            {t('title')}
          </Link>
          <Link href="/admin/programmes" className="block rounded px-3 py-2 hover:bg-accent">
            {t('programmes')}
          </Link>
          <Link href="/admin/cohorts" className="block rounded px-3 py-2 hover:bg-accent">
            {t('cohorts')}
          </Link>
          <Link href="/admin/imports" className="block rounded px-3 py-2 hover:bg-accent">
            {tImports('title')}
          </Link>
          <Link href="/admin/matching" className="block rounded px-3 py-2 hover:bg-accent">
            {tMatching('title')}
          </Link>
          <Link href="/admin/mentors" className="block rounded px-3 py-2 hover:bg-accent">
            {tPeople('mentorsTitle')}
          </Link>
          <Link href="/admin/mentees" className="block rounded px-3 py-2 hover:bg-accent">
            {tPeople('menteesTitle')}
          </Link>
          <Link href="/admin/invites" className="block rounded px-3 py-2 hover:bg-accent">
            {tInvites('title')}
          </Link>
          <Link href="/admin/support" className="block rounded px-3 py-2 hover:bg-accent">
            {tSupport('queueTitle')}
          </Link>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
