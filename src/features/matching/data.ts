import 'server-only';
import { MatchStatus, TrainingStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { MentorForMatching, MenteeForMatching, MatchLanguage } from './engine';

// Loads cohort data and maps it into the pure engine's input shapes.
// All I/O lives here; the engine itself never touches the database.

/** Match statuses that consume mentor capacity. */
export const COMMITTED_STATUSES: MatchStatus[] = [
  MatchStatus.ADMIN_APPROVED,
  MatchStatus.ACCEPTED,
  MatchStatus.OVERRIDDEN,
];

export async function loadMentorsForMatching(cohortId: string): Promise<MentorForMatching[]> {
  const profiles = await prisma.mentorProfile.findMany({
    where: { cohortId, deletedAt: null },
    include: { competencies: { include: { competency: true } } },
  });

  const counts = await prisma.match.groupBy({
    by: ['mentorId'],
    where: { cohortId, status: { in: COMMITTED_STATUSES }, deletedAt: null },
    _count: true,
  });
  const countByMentor = new Map(counts.map((c) => [c.mentorId, c._count]));

  return profiles.map((p) => ({
    id: p.userId,
    cohortId: p.cohortId,
    fullName: p.fullName,
    preferredLanguage: p.preferredLanguage as MatchLanguage,
    yearsExperience: p.yearsExperience,
    department: p.department,
    availability: p.availability,
    personality: p.personality,
    maxMentees: p.maxMentees,
    currentMenteeCount: countByMentor.get(p.userId) ?? 0,
    trainingComplete: p.trainingStatus === TrainingStatus.COMPLETED,
    competencies: p.competencies.map((c) => c.competency.name),
    whatCanLearn: p.whatCanLearn,
  }));
}

export async function loadMenteesForMatching(cohortId: string): Promise<MenteeForMatching[]> {
  const profiles = await prisma.menteeProfile.findMany({
    where: { cohortId, deletedAt: null },
    include: { competencies: { include: { competency: true } } },
  });

  return profiles.map((p) => ({
    id: p.userId,
    cohortId: p.cohortId,
    fullName: p.fullName,
    preferredLanguage: p.preferredLanguage as MatchLanguage,
    department: p.department,
    personality: p.personality,
    // M0/M1 treat completed training as completed onboarding; a dedicated
    // onboarding flow arrives with training batches in a later milestone.
    onboardingComplete: p.trainingStatus === TrainingStatus.COMPLETED,
    careerGoals: p.careerGoals,
    competenciesToStrengthen: p.competencies
      .filter((c) => c.isToStrengthen)
      .map((c) => c.competency.name),
  }));
}
