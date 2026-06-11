import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RoleName } from '@prisma/client';
import { getCurrentUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { getUnreadCount } from '@/lib/notifications/data';
import { AppShell, type AppShellLabels } from '@/components/shell/app-shell';
import { buildAdminNavSections, buildParticipantNavSections } from '@/lib/nav/sections';
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

  // Admins reach the shared Notifications / Support / Help / Profile pages (which
  // live in this group) too — give them their admin nav so they don't lose it on
  // the way in. Participants get the mentor/mentee nav.
  const sections = hasAnyRole(user, ADMIN_ROLES)
    ? await buildAdminNavSections(unread)
    : await buildParticipantNavSections(user.roles, unread);

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
