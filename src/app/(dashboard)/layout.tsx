import { redirect } from 'next/navigation';
import { RoleName } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth/rbac';
import { SiteHeader } from '@/components/site-header';
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates this group, but never trust the
  // edge alone (CLAUDE.md §3).
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10">{children}</main>
      <QuickActions items={quickActionsFor(user.roles)} />
    </div>
  );
}
