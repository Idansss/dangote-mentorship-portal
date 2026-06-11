import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { getUnreadCount, getUserNotifications } from '@/lib/notifications/data';
import { getAiAdapter } from '@/lib/ai';
import { AppShell, type AppShellLabels } from '@/components/shell/app-shell';
import { AtlasCopilot, type AtlasLabels } from '@/features/copilot/atlas-copilot';
import { buildAdminNavSections } from '@/lib/nav/sections';

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

  const [tNav, tShell, tCommon, tCopilot, unread, recentRows] = await Promise.all([
    getTranslations('nav'),
    getTranslations('shell'),
    getTranslations('common'),
    getTranslations('copilot'),
    getUnreadCount(user.id),
    getUserNotifications(user.id, 6),
  ]);
  const copilotLabels: AtlasLabels = {
    title: tCopilot('title'),
    subtitle: tCopilot('subtitle'),
    open: tCopilot('open'),
    close: tCopilot('close'),
    placeholder: tCopilot('placeholder'),
    send: tCopilot('send'),
    greeting: tCopilot('greeting'),
    error: tCopilot('error'),
  };

  const sections = await buildAdminNavSections(unread);

  const labels: AppShellLabels = {
    brand: tCommon('appName'),
    search: tShell('search'),
    notifications: tNav('notifications'),
    notificationsTitle: tNav('notifications'),
    seeAll: tShell('seeAllNotifications'),
    noNotifications: tShell('noNotifications'),
    signOut: tCommon('signOut'),
    openMenu: tShell('openMenu'),
    closeMenu: tShell('closeMenu'),
    collapse: tShell('collapse'),
    expand: tShell('expand'),
    more: tShell('more'),
  };

  const recent = recentRows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.readAt !== null,
  }));

  return (
    <AppShell
      sections={sections}
      unread={unread}
      recent={recent}
      user={{
        name: user.name ?? user.email,
        roleLabel: user.roles.map(roleLabelOf).join(' · '),
        initials: initialsOf(user.name, user.email),
      }}
      labels={labels}
    >
      {children}
      <AtlasCopilot enabled={getAiAdapter().enabled} labels={copilotLabels} />
    </AppShell>
  );
}
