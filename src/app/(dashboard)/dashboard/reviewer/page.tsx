import { getTranslations } from 'next-intl/server';
import { ReviewType } from '@prisma/client';
import { requireRole, getCurrentUser } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getReviewRollup,
  getReviewSummaries,
  resolveReviewerCohortId,
} from '@/features/reviews/rollup';
import { ReviewRollupView } from '@/features/reviews/review-rollup-view';
import { ReviewAssistantPanel } from '@/features/reviews/review-assistant-panel';
import { getCohortRisk } from '@/features/risk/data';
import { RiskPanel } from '@/features/risk/risk-panel';

// Reviewer/Executive dashboard (CLAUDE.md §12). Programme-wide review roll-up:
// completion, per-question aggregates, per-pair completion, language
// participation. Risk alerts and AI narrative summaries are added by the Risk
// Monitor and AI Review Assistant items.
export default async function ReviewerDashboardPage() {
  const user = await requireRole(RoleName.REVIEWER);
  const t = await getTranslations('reviews');
  const current = await getCurrentUser();
  const lang = current?.locale === 'FR' ? 'FR' : 'EN';

  const cohortId = await resolveReviewerCohortId();
  const [rollup, summaries, risk] = cohortId
    ? await Promise.all([
        getReviewRollup(cohortId),
        getReviewSummaries(cohortId),
        getCohortRisk(cohortId),
      ])
    : [null, { midterm: null, final: null }, null];

  return (
    <div className="space-y-6">
      <DashboardHeader titleKey="reviewer" userName={user.name} roles={user.roles} />
      {rollup ? (
        <>
          <ReviewRollupView rollup={rollup} lang={lang} />
          {risk ? <RiskPanel risk={risk} /> : null}
          <section className="grid gap-4 md:grid-cols-2">
            <ReviewAssistantPanel type={ReviewType.MIDTERM} savedSummary={summaries.midterm} />
            <ReviewAssistantPanel type={ReviewType.FINAL} savedSummary={summaries.final} />
          </section>
        </>
      ) : (
        <EmptyState title={t('noCohortTitle')} description={t('noCohortBody')} />
      )}
    </div>
  );
}
