import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { getUnreadCount } from '@/lib/notifications/data';
import { AppShell, type AppShellLabels, type NavSection } from '@/components/shell/app-shell';

function initialsOf(name?: string | null, email?: string): string {
  const source = (name ?? email ?? '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const [a, b] = parts;
  if (a && b) return (a.charAt(0) + b.charAt(0)).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function roleLabelOf(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate (CLAUDE.md §3, §4): the admin area requires an admin role.
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!hasAnyRole(user, ADMIN_ROLES)) redirect('/dashboard');

  const [t, tImports, tMatching, tPeople, tInvites, tSupport, tForms, tNav, tShell, tCommon, unread] =
    await Promise.all([
      getTranslations('admin'),
      getTranslations('imports'),
      getTranslations('matching'),
      getTranslations('people'),
      getTranslations('invites'),
      getTranslations('support'),
      getTranslations('forms'),
      getTranslations('nav'),
      getTranslations('shell'),
      getTranslations('common'),
      getUnreadCount(user.id),
    ]);

  const sections: NavSection[] = [
    {
      label: tShell('navManage'),
      items: [
        { href: '/admin', label: tNav('dashboard'), icon: 'dashboard', primary: true, exact: true },
        { href: '/admin/matching', label: tMatching('title'), icon: 'matching', primary: true },
        { href: '/admin/programmes', label: t('programmes'), icon: 'programmes' },
        { href: '/admin/cohorts', label: t('cohorts'), icon: 'cohorts' },
        { href: '/admin/imports', label: tImports('title'), icon: 'imports' },
        { href: '/admin/forms', label: tForms('title'), icon: 'forms' },
      ],
    },
    {
      label: tShell('navPeople'),
      items: [
        { href: '/admin/mentors', label: tPeople('mentorsTitle'), icon: 'mentors', primary: true },
        { href: '/admin/mentees', label: tPeople('menteesTitle'), icon: 'mentees', primary: true },
        { href: '/admin/invites', label: tInvites('title'), icon: 'invites' },
      ],
    },
    {
      label: tShell('navHelp'),
      items: [
        { href: '/notifications', label: tNav('notifications'), icon: 'notifications', badge: unread || undefined },
        { href: '/admin/support', label: tSupport('queueTitle'), icon: 'support' },
      ],
    },
  ];

  const labels: AppShellLabels = {
    brand: tCommon('appName'),
    search: tShell('search'),
    notifications: tNav('notifications'),
    signOut: tCommon('signOut'),
    openMenu: tShell('openMenu'),
    closeMenu: tShell('closeMenu'),
    collapse: tShell('collapse'),
    expand: tShell('expand'),
    more: tShell('more'),
  };

  return (
    <AppShell
      sections={sections}
      unread={unread}
      user={{
        name: user.name ?? user.email,
        roleLabel: user.roles.map(roleLabelOf).join(' · '),
        initials: initialsOf(user.name, user.email),
      }}
      labels={labels}
    >
      {children}
    </AppShell>
  );
}
