import 'server-only';
import { MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// Shared resolution of accepted mentor↔mentee pairings (CLAUDE.md M2). The
// mentorship-loop features (goals, session logs, …) all authorize against the
// accepted Match, so the lookups live here once.

export interface MenteePairing {
  cohortId: string;
  mentorId: string;
  mentorName: string | null;
}

export interface MentorPairing {
  cohortId: string;
  menteeId: string;
  menteeName: string | null;
}

/** The mentee's active pairing (the mentor on the other side), or null. */
export async function getMenteePairing(userId: string): Promise<MenteePairing | null> {
  const match = await prisma.match.findFirst({
    where: { menteeId: userId, status: MatchStatus.ACCEPTED, deletedAt: null },
    orderBy: { acceptedAt: 'desc' },
    include: { mentor: { select: { id: true, name: true } } },
  });
  if (!match) return null;
  return { cohortId: match.cohortId, mentorId: match.mentor.id, mentorName: match.mentor.name };
}

/** All mentees this mentor is paired with. */
export async function getMentorPairings(userId: string): Promise<MentorPairing[]> {
  const matches = await prisma.match.findMany({
    where: { mentorId: userId, status: MatchStatus.ACCEPTED, deletedAt: null },
    orderBy: { acceptedAt: 'desc' },
    include: { mentee: { select: { id: true, name: true } } },
  });
  return matches.map((m) => ({
    cohortId: m.cohortId,
    menteeId: m.mentee.id,
    menteeName: m.mentee.name,
  }));
}

/**
 * The cohort of the mentor↔mentee accepted pairing, or null when they are not
 * paired. Used by the mentorship-loop features that authorize a mentor acting on
 * a specific mentee (session logs, mentor private notes, …).
 */
export async function mentorPairCohort(
  mentorId: string,
  menteeId: string,
): Promise<string | null> {
  const match = await prisma.match.findFirst({
    where: { mentorId, menteeId, status: MatchStatus.ACCEPTED, deletedAt: null },
    orderBy: { acceptedAt: 'desc' },
    select: { cohortId: true },
  });
  return match?.cohortId ?? null;
}

/** True when mentorId and menteeId are an accepted pair in the given cohort. */
export async function isAcceptedPair(
  mentorId: string,
  menteeId: string,
  cohortId: string,
): Promise<boolean> {
  const match = await prisma.match.findFirst({
    where: { cohortId, mentorId, menteeId, status: MatchStatus.ACCEPTED, deletedAt: null },
    select: { id: true },
  });
  return match !== null;
}
