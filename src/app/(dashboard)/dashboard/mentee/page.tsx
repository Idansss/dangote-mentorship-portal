import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MenteeSummary } from '@/components/dashboard/mentee-summary';
import { WeeklyTip } from '@/components/dashboard/weekly-tip';
import { JourneyRail } from '@/components/journey-rail';
import { NextActionButton } from '@/components/next-action-button';
import { OnboardingTour } from '@/components/onboarding-tour';
import { getJourney } from '@/features/journey/data';
import { getMenteeDashboard } from '@/features/dashboard/data';
import { MatchPanel } from '@/features/matching/match-panel';

export default async function MenteeDashboardPage() {
  const user = await requireRole(RoleName.MENTEE);
  const [journey, dashboard] = await Promise.all([
    getJourney(user.id, 'mentee'),
    getMenteeDashboard(user.id),
  ]);
  return (
    <div className="space-y-6">
      <DashboardHeader titleKey="mentee" userName={user.name} roles={user.roles} />
      <OnboardingTour role="mentee" />
      <JourneyRail result={journey} />
      <NextActionButton />
      <MatchPanel userId={user.id} role="mentee" />
      <MenteeSummary data={dashboard} />
      <WeeklyTip />
    </div>
  );
}
