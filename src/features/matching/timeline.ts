import 'server-only';
import { MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { COMMITTED_STATUSES } from './data';

// Pairs-engagement timeline (admin matching page). Each committed pair becomes a
// row; across the cohort's months we bucket session-log activity into a per-month
// count, giving the Renaizant-style "engagement across the programme" heat row.
// Metadata only (counts + dates), never session content — consistent with the
// Risk Monitor's confidentiality stance (CLAUDE.md §9.8).

const MAX_MONTHS = 12; // guard against an mis-entered multi-year cohort window

export interface TimelinePair {
  matchId: string;
  mentorName: string | null;
  menteeName: string | null;
  status: MatchStatus;
  totalSessions: number;
  lastSessionAt: Date | null;
  /** Session count per month, aligned to `monthStarts`. */
  monthly: number[];
}

export interface PairsTimeline {
  /** First day of each month in the cohort window (UTC). */
  monthStarts: Date[];
  /** Index into `monthStarts` for the month containing "now", or null if outside. */
  currentMonthIndex: number | null;
  pairs: TimelinePair[];
  /** Largest single-month session count across all pairs (for scaling). */
  peakMonthly: number;
}

function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export async function getPairsTimeline(cohortId: string): Promise<PairsTimeline> {
  const now = new Date();

  const cohort = await prisma.cohort.findUnique({
    where: { id: cohortId },
    select: { startDate: true, endDate: true, createdAt: true },
  });

  // Resolve the month window: the cohort's start→end, falling back to a 9-month
  // programme (CLAUDE.md §1) anchored on the start when an end isn't set.
  const start = monthStart(cohort?.startDate ?? cohort?.createdAt ?? now);
  const endSource = cohort?.endDate ?? addMonths(start, 8);
  const end = monthStart(endSource);

  const monthStarts: Date[] = [];
  let cursor = start;
  while (cursor <= end && monthStarts.length < MAX_MONTHS) {
    monthStarts.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  if (monthStarts.length === 0) monthStarts.push(start);

  const monthIndexOf = (date: Date): number => {
    const ms = monthStart(date).getTime();
    return monthStarts.findIndex((m) => m.getTime() === ms);
  };
  const nowMonth = monthStart(now).getTime();
  const currentMonthIndex = monthStarts.findIndex((m) => m.getTime() === nowMonth);

  const [matches, sessions] = await Promise.all([
    prisma.match.findMany({
      where: { cohortId, status: { in: COMMITTED_STATUSES }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { mentor: { select: { name: true } }, mentee: { select: { name: true } } },
    }),
    prisma.sessionLog.findMany({
      where: { cohortId, deletedAt: null },
      select: { mentorId: true, menteeId: true, date: true },
    }),
  ]);

  // Bucket sessions per pair per month.
  const monthlyByPair = new Map<string, number[]>();
  const totalByPair = new Map<string, number>();
  const lastByPair = new Map<string, Date>();
  for (const s of sessions) {
    const key = `${s.mentorId}:${s.menteeId}`;
    totalByPair.set(key, (totalByPair.get(key) ?? 0) + 1);
    if (s.date) {
      const prev = lastByPair.get(key);
      if (!prev || s.date > prev) lastByPair.set(key, s.date);
      const idx = monthIndexOf(s.date);
      if (idx >= 0) {
        const arr = monthlyByPair.get(key) ?? new Array(monthStarts.length).fill(0);
        arr[idx] += 1;
        monthlyByPair.set(key, arr);
      }
    }
  }

  let peakMonthly = 0;
  const pairs: TimelinePair[] = matches.map((m) => {
    const key = `${m.mentorId}:${m.menteeId}`;
    const monthly = monthlyByPair.get(key) ?? new Array(monthStarts.length).fill(0);
    for (const c of monthly) if (c > peakMonthly) peakMonthly = c;
    return {
      matchId: m.id,
      mentorName: m.mentor.name,
      menteeName: m.mentee.name,
      status: m.status,
      totalSessions: totalByPair.get(key) ?? 0,
      lastSessionAt: lastByPair.get(key) ?? null,
      monthly,
    };
  });

  return { monthStarts, currentMonthIndex: currentMonthIndex >= 0 ? currentMonthIndex : null, pairs, peakMonthly };
}
