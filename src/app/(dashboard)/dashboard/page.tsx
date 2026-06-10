import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { DashboardStub } from '@/components/dashboard-stub';

export default async function DashboardIndexPage() {
  const user = await requireUser();
  const target = defaultDashboardPath(user.roles);

  // Route users with a specific role to their dedicated dashboard; users with
  // no role yet (e.g. fresh SSO sign-in awaiting assignment) see the generic one.
  if (target !== '/dashboard') redirect(target);

  return <DashboardStub titleKey="generic" userName={user.name} roles={user.roles} />;
}
