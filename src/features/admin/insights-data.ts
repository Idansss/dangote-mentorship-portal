import 'server-only';
import { GoalStatus, Language, MatchingStatus, TrainingStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// Read model for the admin Insights page (§12 — language distribution, matched vs
// unmatched, training completion, goal pipeline). Pure aggregate counts over the
// live profile/goal tables; the charts that render these live client-side.

export interface LanguageSlice {
  language: Language;
  count: number;
}

export interface GroupedPair {
  /** "Mentors" / "Mentees" — the x-axis category. */
  group: 'mentors' | 'mentees';
  a: number; // matched / completed
  b: number; // unmatched / pending
}

export interface GoalStageCount {
  stage: 'submitted' | 'approved' | 'completed';
  count: number;
}

export interface AdminInsights {
  languages: LanguageSlice[];
  matching: GroupedPair[];
  training: GroupedPair[];
  goals: GoalStageCount[];
  total: number;
}

export async function getAdminInsights(): Promise<AdminInsights> {
  const profileWhere = { deletedAt: null };
  const [
    mentorEn,
    mentorFr,
    menteeEn,
    menteeFr,
    mentorMatched,
    mentorTotal,
    menteeMatched,
    menteeTotal,
    mentorTrained,
    menteeTrained,
    goalsSubmitted,
    goalsApproved,
    goalsCompleted,
  ] = await Promise.all([
    prisma.mentorProfile.count({ where: { ...profileWhere, preferredLanguage: Language.EN } }),
    prisma.mentorProfile.count({ where: { ...profileWhere, preferredLanguage: Language.FR } }),
    prisma.menteeProfile.count({ where: { ...profileWhere, preferredLanguage: Language.EN } }),
    prisma.menteeProfile.count({ where: { ...profileWhere, preferredLanguage: Language.FR } }),
    prisma.mentorProfile.count({ where: { ...profileWhere, matchingStatus: MatchingStatus.MATCHED } }),
    prisma.mentorProfile.count({ where: profileWhere }),
    prisma.menteeProfile.count({ where: { ...profileWhere, matchingStatus: MatchingStatus.MATCHED } }),
    prisma.menteeProfile.count({ where: profileWhere }),
    prisma.mentorProfile.count({ where: { ...profileWhere, trainingStatus: TrainingStatus.COMPLETED } }),
    prisma.menteeProfile.count({ where: { ...profileWhere, trainingStatus: TrainingStatus.COMPLETED } }),
    prisma.goal.count({ where: { deletedAt: null, status: GoalStatus.SUBMITTED } }),
    prisma.goal.count({ where: { deletedAt: null, status: GoalStatus.APPROVED } }),
    prisma.goal.count({ where: { deletedAt: null, status: GoalStatus.COMPLETED } }),
  ]);

  return {
    languages: [
      { language: Language.EN, count: mentorEn + menteeEn },
      { language: Language.FR, count: mentorFr + menteeFr },
    ],
    matching: [
      { group: 'mentors', a: mentorMatched, b: mentorTotal - mentorMatched },
      { group: 'mentees', a: menteeMatched, b: menteeTotal - menteeMatched },
    ],
    training: [
      { group: 'mentors', a: mentorTrained, b: mentorTotal - mentorTrained },
      { group: 'mentees', a: menteeTrained, b: menteeTotal - menteeTrained },
    ],
    goals: [
      { stage: 'submitted', count: goalsSubmitted },
      { stage: 'approved', count: goalsApproved },
      { stage: 'completed', count: goalsCompleted },
    ],
    total: mentorTotal + menteeTotal,
  };
}
