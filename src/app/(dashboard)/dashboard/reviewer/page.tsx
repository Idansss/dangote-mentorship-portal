import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardStub } from '@/components/dashboard-stub';

export default async function ReviewerDashboardPage() {
  const user = await requireRole(RoleName.REVIEWER);
  return <DashboardStub titleKey="reviewer" userName={user.name} roles={user.roles} />;
}
