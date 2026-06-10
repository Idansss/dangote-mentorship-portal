import 'server-only';
import { CohortStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { summarizeBatch, computeTrainerTotals, type TrainerDashboard } from './summary';

// Trainer dashboard data (CLAUDE.md §12 trainer view, RBAC §4 "view own batches").
// The pure roll-up lives in summary.ts; this file is only the DB read.
//
// NOTE: the schema has no facilitator FK on TrainingBatch, so "own batches"
// cannot be a per-trainer ownership link. For the single-cohort pilot we scope to
// the trainer's active cohort's batches (a real facilitator assignment is a later
// schema change — cf. M2 audit H1 on cohort-scoped grants).
export type { BatchSummary, TrainerDashboard, TrainerTotals } from './summary';
export { summarizeBatch, computeTrainerTotals } from './summary';

export async function resolveTrainerCohortId(): Promise<string | null> {
  const active = await prisma.cohort.findFirst({
    where: { status: CohortStatus.ACTIVE, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return active?.id ?? null;
}

export async function getTrainerDashboard(cohortId: string): Promise<TrainerDashboard> {
  const batches = await prisma.trainingBatch.findMany({
    where: { cohortId, deletedAt: null },
    orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    include: {
      attendance: { where: { deletedAt: null }, select: { status: true } },
      assessments: { where: { deletedAt: null }, select: { passed: true } },
      _count: { select: { materials: { where: { deletedAt: null } } } },
    },
  });

  const summaries = batches.map((b) =>
    summarizeBatch({
      id: b.id,
      name: b.name,
      startDate: b.startDate,
      endDate: b.endDate,
      attendance: b.attendance,
      assessments: b.assessments,
      materials: b._count.materials,
    }),
  );

  return { batches: summaries, totals: computeTrainerTotals(summaries) };
}
