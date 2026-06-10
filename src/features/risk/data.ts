import 'server-only';
import { CohortStatus, GoalStatus, MatchStatus, ReviewStatus, ReviewType, RoleName } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getActiveFormDefinition } from '@/features/forms/data';
import { evaluatePairRisk, worstSeverity, type RiskFlag, type RiskSeverity } from './rules';

/** The active cohort (single-cohort pilot — see M2 audit H1). */
export async function resolveActiveCohortId(): Promise<string | null> {
  const active = await prisma.cohort.findFirst({
    where: { status: CohortStatus.ACTIVE, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return active?.id ?? null;
}

// Risk & Engagement Monitor data layer (CLAUDE.md §9.8). Gathers engagement
// METADATA ONLY — session/goal/review counts and dates, never any content — and
// hands it to the pure rules. The result drives the at-risk panels on the admin
// and reviewer dashboards.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY);
}

export interface AtRiskPair {
  matchId: string;
  mentorName: string | null;
  menteeName: string | null;
  severity: RiskSeverity;
  flags: RiskFlag[];
}

export interface CohortRisk {
  pairs: AtRiskPair[];
  atRiskCount: number; // pairs with a 'risk' flag
  watchCount: number; // pairs whose worst is 'warn'
}

export async function getCohortRisk(cohortId: string): Promise<CohortRisk> {
  const now = new Date();

  const matches = await prisma.match.findMany({
    where: { cohortId, status: MatchStatus.ACCEPTED, deletedAt: null },
    orderBy: { acceptedAt: 'desc' },
    include: { mentor: { select: { name: true } }, mentee: { select: { name: true } } },
  });
  if (matches.length === 0) return { pairs: [], atRiskCount: 0, watchCount: 0 };

  const menteeIds = [...new Set(matches.map((m) => m.menteeId))];

  const [sessions, goals, reviewResponses, midtermForm, finalForm] = await Promise.all([
    prisma.sessionLog.findMany({
      where: { cohortId, deletedAt: null },
      select: { mentorId: true, menteeId: true, date: true },
    }),
    prisma.goal.findMany({
      where: { menteeId: { in: menteeIds }, deletedAt: null },
      select: { menteeId: true, status: true },
    }),
    prisma.formResponse.findMany({
      where: { status: ReviewStatus.SUBMITTED, deletedAt: null, form: { cohortId, deletedAt: null } },
      select: { respondentId: true, form: { select: { type: true } } },
    }),
    getActiveFormDefinition(cohortId, ReviewType.MIDTERM, RoleName.MENTEE),
    getActiveFormDefinition(cohortId, ReviewType.FINAL, RoleName.MENTEE),
  ]);

  // Index metadata for O(1) per-pair lookups.
  const sessionCountByPair = new Map<string, number>();
  const lastSessionByPair = new Map<string, Date>();
  for (const s of sessions) {
    const key = `${s.mentorId}:${s.menteeId}`;
    sessionCountByPair.set(key, (sessionCountByPair.get(key) ?? 0) + 1);
    if (s.date) {
      const prev = lastSessionByPair.get(key);
      if (!prev || s.date > prev) lastSessionByPair.set(key, s.date);
    }
  }

  const goalsByMentee = new Map<string, { submitted: number; awaiting: number }>();
  for (const g of goals) {
    const entry = goalsByMentee.get(g.menteeId) ?? { submitted: 0, awaiting: 0 };
    if (g.status !== GoalStatus.DRAFT) entry.submitted += 1;
    if (g.status === GoalStatus.SUBMITTED) entry.awaiting += 1;
    goalsByMentee.set(g.menteeId, entry);
  }

  const reviewDone = new Set(reviewResponses.map((r) => `${r.respondentId}:${r.form.type}`));
  const reviewedBoth = (mentorId: string, menteeId: string, type: ReviewType) =>
    reviewDone.has(`${mentorId}:${type}`) && reviewDone.has(`${menteeId}:${type}`);

  const pairs: AtRiskPair[] = [];
  for (const m of matches) {
    const key = `${m.mentorId}:${m.menteeId}`;
    const goalStats = goalsByMentee.get(m.menteeId) ?? { submitted: 0, awaiting: 0 };

    const flags = evaluatePairRisk({
      daysSinceMatch: daysSince(m.acceptedAt, now) ?? 0,
      sessionCount: sessionCountByPair.get(key) ?? 0,
      daysSinceLastSession: daysSince(lastSessionByPair.get(key) ?? null, now),
      goalsSubmitted: goalStats.submitted,
      goalsAwaitingApproval: goalStats.awaiting,
      midtermPublished: midtermForm !== null,
      midtermComplete: reviewedBoth(m.mentorId, m.menteeId, ReviewType.MIDTERM),
      finalPublished: finalForm !== null,
      finalComplete: reviewedBoth(m.mentorId, m.menteeId, ReviewType.FINAL),
    });

    const severity = worstSeverity(flags);
    if (severity) {
      pairs.push({ matchId: m.id, mentorName: m.mentor.name, menteeName: m.mentee.name, severity, flags });
    }
  }

  // Risk before watch, so the most urgent pairs surface first.
  pairs.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'risk' ? -1 : 1));

  return {
    pairs,
    atRiskCount: pairs.filter((p) => p.severity === 'risk').length,
    watchCount: pairs.filter((p) => p.severity === 'warn').length,
  };
}
