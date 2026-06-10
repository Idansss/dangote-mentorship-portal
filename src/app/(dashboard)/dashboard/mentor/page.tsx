import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardStub } from '@/components/dashboard-stub';
import { MatchPanel } from '@/features/matching/match-panel';

export default async function MentorDashboardPage() {
  const user = await requireRole(RoleName.MENTOR);
  return (
    <div className="space-y-6">
      <DashboardStub titleKey="mentor" userName={user.name} roles={user.roles} />
      <MatchPanel userId={user.id} role="mentor" />
    </div>
  );
}
