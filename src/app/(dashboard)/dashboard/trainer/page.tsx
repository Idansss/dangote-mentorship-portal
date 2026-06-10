import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardStub } from '@/components/dashboard-stub';

export default async function TrainerDashboardPage() {
  const user = await requireRole(RoleName.TRAINER);
  return <DashboardStub titleKey="trainer" userName={user.name} roles={user.roles} />;
}
