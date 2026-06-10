import 'server-only';
import type { Meeting } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getMenteePairing, getMentorPairings } from '@/lib/pairings';

export { getMenteePairing, getMentorPairings };

export type MeetingWithPeople = Meeting & {
  mentor: { name: string | null };
  mentee: { name: string | null };
  organizer: { name: string | null };
};

/** All meetings the user is part of (as mentor or mentee), newest start first. */
export async function getUserMeetings(userId: string): Promise<MeetingWithPeople[]> {
  return prisma.meeting.findMany({
    where: {
      deletedAt: null,
      OR: [{ mentorId: userId }, { menteeId: userId }],
    },
    orderBy: [{ startsAt: 'desc' }],
    include: {
      mentor: { select: { name: true } },
      mentee: { select: { name: true } },
      organizer: { select: { name: true } },
    },
  });
}

export interface CounterpartOption {
  id: string;
  name: string | null;
  role: 'mentor' | 'mentee';
}

/**
 * The people this user can schedule with: a mentor sees their mentees, a mentee
 * sees their mentor. Drawn from accepted pairings only.
 */
export async function getSchedulableCounterparts(
  userId: string,
  roles: { isMentor: boolean; isMentee: boolean },
): Promise<CounterpartOption[]> {
  const options: CounterpartOption[] = [];
  if (roles.isMentor) {
    const pairings = await getMentorPairings(userId);
    for (const p of pairings) options.push({ id: p.menteeId, name: p.menteeName, role: 'mentee' });
  }
  if (roles.isMentee) {
    const pairing = await getMenteePairing(userId);
    if (pairing) options.push({ id: pairing.mentorId, name: pairing.mentorName, role: 'mentor' });
  }
  return options;
}
