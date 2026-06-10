import 'server-only';
import { CohortStatus, Language, MatchStatus, ReviewStatus, ReviewType, RoleName } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getActiveFormDefinition } from '@/features/forms/data';
import { aggregateAnswers, completionPercent, type FieldAggregate } from './aggregate';
import type { ReviewAnswers } from './schema';

// Review roll-up data layer (CLAUDE.md §5, §12 executive dashboard, M3). Loads
// the records and hands them to the pure aggregator. Cohort-scoped; the reviewer
// dashboard resolves the cohort below.
//
// NOTE (M2 audit finding H1): the session does not yet carry a cohortId, so for
// the single-cohort pilot we resolve the active cohort. This becomes a real
// cohort filter once role grants are cohort-scoped in the session.
export async function resolveReviewerCohortId(): Promise<string | null> {
  const active = await prisma.cohort.findFirst({
    where: { status: CohortStatus.ACTIVE, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return active?.id ?? null;
}

export interface ReviewTypeSummary {
  type: ReviewType;
  /** Whether a form is published for this review type. */
  published: boolean;
  formTitle: string | null;
  eligible: number;
  submitted: number;
  percent: number;
  aggregates: FieldAggregate[];
}

export interface PairReviewStatus {
  matchId: string;
  mentorName: string | null;
  menteeName: string | null;
  mentorMidterm: boolean;
  menteeMidterm: boolean;
  mentorFinal: boolean;
  menteeFinal: boolean;
}

export interface ReviewRollup {
  cohortId: string;
  eligibleParticipants: number;
  midterm: ReviewTypeSummary;
  final: ReviewTypeSummary;
  pairs: PairReviewStatus[];
  language: { en: number; fr: number };
  departments: { name: string; count: number }[];
}

/** Distinct mentors + mentees across accepted matches — who is eligible to
 *  submit a review in this cohort. */
async function getEligibleParticipants(cohortId: string): Promise<{
  mentorIds: string[];
  menteeIds: string[];
}> {
  const matches = await prisma.match.findMany({
    where: { cohortId, status: MatchStatus.ACCEPTED, deletedAt: null },
    select: { mentorId: true, menteeId: true },
  });
  return {
    mentorIds: [...new Set(matches.map((m) => m.mentorId))],
    menteeIds: [...new Set(matches.map((m) => m.menteeId))],
  };
}

async function summarizeType(
  cohortId: string,
  type: ReviewType,
  eligible: number,
): Promise<ReviewTypeSummary> {
  // Aggregate against the currently active form (role-agnostic fallback). The
  // mentee/mentor role here only steers form selection; the seeded forms are
  // role-agnostic, so both resolve to the same definition.
  const form = await getActiveFormDefinition(cohortId, type, RoleName.MENTEE);
  if (!form) {
    return { type, published: false, formTitle: null, eligible, submitted: 0, percent: 0, aggregates: [] };
  }

  const responses = await prisma.formResponse.findMany({
    where: { formId: form.id, status: ReviewStatus.SUBMITTED, deletedAt: null },
    select: { answers: true },
  });
  const answers = responses.map((r) => (r.answers as ReviewAnswers) ?? {});

  return {
    type,
    published: true,
    formTitle: form.title,
    eligible,
    submitted: responses.length,
    percent: completionPercent(responses.length, eligible),
    aggregates: aggregateAnswers(form.schema.fields, answers),
  };
}

async function getPairStatuses(cohortId: string): Promise<PairReviewStatus[]> {
  const matches = await prisma.match.findMany({
    where: { cohortId, status: MatchStatus.ACCEPTED, deletedAt: null },
    orderBy: { acceptedAt: 'desc' },
    include: {
      mentor: { select: { name: true } },
      mentee: { select: { name: true } },
    },
  });

  // One pass over submitted responses → a set of "userId:type" that submitted.
  const submitted = await prisma.formResponse.findMany({
    where: {
      status: ReviewStatus.SUBMITTED,
      deletedAt: null,
      form: { cohortId, deletedAt: null },
    },
    select: { respondentId: true, form: { select: { type: true } } },
  });
  const done = new Set(submitted.map((r) => `${r.respondentId}:${r.form.type}`));
  const has = (userId: string, type: ReviewType) => done.has(`${userId}:${type}`);

  return matches.map((m) => ({
    matchId: m.id,
    mentorName: m.mentor.name,
    menteeName: m.mentee.name,
    mentorMidterm: has(m.mentorId, ReviewType.MIDTERM),
    menteeMidterm: has(m.menteeId, ReviewType.MIDTERM),
    mentorFinal: has(m.mentorId, ReviewType.FINAL),
    menteeFinal: has(m.menteeId, ReviewType.FINAL),
  }));
}

async function getParticipation(
  mentorIds: string[],
  menteeIds: string[],
): Promise<{ language: { en: number; fr: number }; departments: { name: string; count: number }[] }> {
  const [mentors, mentees] = await Promise.all([
    prisma.mentorProfile.findMany({
      where: { userId: { in: mentorIds }, deletedAt: null },
      select: { preferredLanguage: true, department: true },
    }),
    prisma.menteeProfile.findMany({
      where: { userId: { in: menteeIds }, deletedAt: null },
      select: { preferredLanguage: true, department: true },
    }),
  ]);
  const all = [...mentors, ...mentees];

  const deptTally = new Map<string, number>();
  for (const p of all) {
    const name = p.department?.trim();
    if (name) deptTally.set(name, (deptTally.get(name) ?? 0) + 1);
  }

  return {
    language: {
      en: all.filter((p) => p.preferredLanguage === Language.EN).length,
      fr: all.filter((p) => p.preferredLanguage === Language.FR).length,
    },
    departments: [...deptTally.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** The human-approved AI summaries saved on each review cycle, if any. */
export async function getReviewSummaries(
  cohortId: string,
): Promise<{ midterm: string | null; final: string | null }> {
  const [midterm, final] = await Promise.all([
    prisma.midtermReview.findFirst({
      where: { cohortId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { aiSummary: true },
    }),
    prisma.finalReview.findFirst({
      where: { cohortId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { aiSummary: true },
    }),
  ]);
  return { midterm: midterm?.aiSummary ?? null, final: final?.aiSummary ?? null };
}

/** Full executive roll-up for a cohort: completion + per-question aggregates for
 *  both reviews, the per-pair completion matrix, and language participation. */
export async function getReviewRollup(cohortId: string): Promise<ReviewRollup> {
  const { mentorIds, menteeIds } = await getEligibleParticipants(cohortId);
  const eligible = mentorIds.length + menteeIds.length;

  const [midterm, final, pairs, participation] = await Promise.all([
    summarizeType(cohortId, ReviewType.MIDTERM, eligible),
    summarizeType(cohortId, ReviewType.FINAL, eligible),
    getPairStatuses(cohortId),
    getParticipation(mentorIds, menteeIds),
  ]);

  return {
    cohortId,
    eligibleParticipants: eligible,
    midterm,
    final,
    pairs,
    language: participation.language,
    departments: participation.departments,
  };
}
