import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RoleName } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { getUnreadCount } from '@/lib/notifications/data';
import { AppShell, type AppShellLabels, type NavSection } from '@/components/shell/app-shell';
import { QuickActions, type QuickActionItem } from '@/components/quick-actions';

// Quick Actions (§1.9) shown across the authenticated participant area. Items are
// filtered to what the user's role can actually do, shortest-path first.
function quickActionsFor(roles: RoleName[]): QuickActionItem[] {
  const items: QuickActionItem[] = [];
  const isMentor = roles.includes(RoleName.MENTOR);
  const isMentee = roles.includes(RoleName.MENTEE);

  if (isMentor || isMentee) {
    items.push({ labelKey: 'scheduleMeeting', href: '/meetings' });
  }
  if (isMentor) {
    items.push({ labelKey: 'addSessionLog', href: '/sessions' });
  }
  if (isMentee) {
    items.push({ labelKey: 'submitGoal', href: '/goals' });
  }
  if (isMentor || isMentee) {
    items.push({ labelKey: 'addReflection', href: '/journal' });
    items.push({ labelKey: 'requestSupport', href: '/support' });
  }
  return items;
}

function initialsOf(name?: string | null, email?: string): string {
  const source = (name ?? email ?? '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const [a, b] = parts;
  if (a && b) return (a.charAt(0) + b.charAt(0)).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function roleLabelOf(role: RoleName): string {
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates this group, but never trust the
  // edge alone (CLAUDE.md §3).
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [tNav, tShell, tCommon, unread] = await Promise.all([
    getTranslations('nav'),
    getTranslations('shell'),
    getTranslations('common'),
    getUnreadCount(user.id),
  ]);

  const isPair = user.roles.includes(RoleName.MENTOR) || user.roles.includes(RoleName.MENTEE);

  const sections: NavSection[] = [
    {
      label: tShell('navMain'),
      items: [
        { href: defaultDashboardPath(user.roles), label: tNav('dashboard'), icon: 'dashboard', primary: true, exact: true },
        ...(isPair
          ? ([
              { href: '/pair', label: tNav('pair'), icon: 'pair', primary: true },
              { href: '/goals', label: tNav('goals'), icon: 'goals', primary: true },
              { href: '/sessions', label: tNav('sessions'), icon: 'sessions', primary: true },
              { href: '/meetings', label: tNav('meetings'), icon: 'meetings' },
              { href: '/calendar', label: tNav('calendar'), icon: 'calendar' },
              { href: '/journal', label: tNav('journal'), icon: 'journal' },
              { href: '/agreements', label: tNav('agreements'), icon: 'agreements' },
            ] as const)
          : []),
      ],
    },
    ...(isPair
      ? [
          {
            label: tShell('navReviews'),
            items: [
              { href: '/mid-term-review', label: tNav('midTermReview'), icon: 'midterm' as const },
              { href: '/final-review', label: tNav('finalReview'), icon: 'final' as const },
            ],
          },
        ]
      : []),
    {
      label: tShell('navHelp'),
      items: [
        { href: '/notifications', label: tNav('notifications'), icon: 'notifications', badge: unread || undefined },
        { href: '/support', label: tNav('support'), icon: 'support' },
        { href: '/help', label: tNav('help'), icon: 'help' },
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
      <QuickActions items={quickActionsFor(user.roles)} />
    </AppShell>
  );
}
