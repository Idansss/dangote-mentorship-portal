import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { MenteeSummary } from '@/components/dashboard/mentee-summary';
import { JourneyRail } from '@/components/journey-rail';
import { NextActionButton } from '@/components/next-action-button';
import { getJourney } from '@/features/journey/data';
import { getMenteeDashboard } from '@/features/dashboard/data';

export default async function MenteeDashboardPage() {
  const user = await requireRole(RoleName.MENTEE);
  const [journey, dashboard] = await Promise.all([
    getJourney(user.id, 'mentee'),
    getMenteeDashboard(user.id),
  ]);
  return (
    <div className="space-y-6">
      <JourneyRail result={journey} />
      <NextActionButton />
      <MenteeSummary data={dashboard} />
    </div>
  );
}
