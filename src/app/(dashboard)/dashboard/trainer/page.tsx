import { getTranslations } from 'next-intl/server';
import { requireRole, getCurrentUser } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyState } from '@/components/ui/empty-state';
import { getTrainerDashboard, resolveTrainerCohortId } from '@/features/training/data';
import { TrainerDashboardView } from '@/features/training/trainer-dashboard-view';

// Trainer dashboard (CLAUDE.md §12). Real data: the trainer's cohort training
// batches with attendance + assessment progress, replacing the M0 stub.
export default async function TrainerDashboardPage() {
  const user = await requireRole(RoleName.TRAINER);
  const t = await getTranslations('trainer');
  const current = await getCurrentUser();
  const lang = current?.locale === 'FR' ? 'FR' : 'EN';

  const cohortId = await resolveTrainerCohortId();

  return (
    <div className="space-y-6">
      <DashboardHeader titleKey="trainer" userName={user.name} roles={user.roles} />
      {cohortId ? (
        <TrainerDashboardView data={await getTrainerDashboard(cohortId)} lang={lang} />
      ) : (
        <EmptyState title={t('noCohortTitle')} description={t('noCohortBody')} />
      )}
    </div>
  );
}
