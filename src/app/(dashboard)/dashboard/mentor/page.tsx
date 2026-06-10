import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MentorSummary } from '@/components/dashboard/mentor-summary';
import { JourneyTracker } from '@/components/journey-tracker';
import { NextActionButton } from '@/components/next-action-button';
import { OnboardingTour } from '@/components/onboarding-tour';
import { getJourney } from '@/features/journey/data';
import { getMentorDashboard } from '@/features/dashboard/data';
import { MatchPanel } from '@/features/matching/match-panel';

export default async function MentorDashboardPage() {
  const user = await requireRole(RoleName.MENTOR);
  const [journey, dashboard] = await Promise.all([
    getJourney(user.id, 'mentor'),
    getMentorDashboard(user.id),
  ]);
  return (
    <div className="space-y-6">
      <DashboardHeader titleKey="mentor" userName={user.name} roles={user.roles} />
      <OnboardingTour role="mentor" />
      <NextActionButton />
      <MatchPanel userId={user.id} role="mentor" />
      <MentorSummary data={dashboard} />
      <JourneyTracker result={journey} />
    </div>
  );
}
