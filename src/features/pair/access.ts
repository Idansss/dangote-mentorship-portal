import { MatchStatus } from '@prisma/client';

// Pure access rule for the Pair Contract Page (experience-layer.md §1.8). The
// shared workspace is visible ONLY to the two people in the accepted pair: the
// mentee themselves, or the mentor on the other side. Admins are not viewers
// here (the page is the pair's private home base). Kept pure and unit-tested as
// the safety-critical authorization, then re-applied on top of the query.

export interface PairMatchFacts {
  mentorId: string;
  menteeId: string;
  status: MatchStatus;
  deletedAt?: Date | null;
}

export type PairRole = 'mentor' | 'mentee';

/**
 * The viewer's role in this pair, or null when they may not see it. Access is
 * granted only for an accepted, non-deleted match in which the viewer is the
 * mentor or the mentee. Every other case (suggested/rejected/deleted match,
 * unrelated viewer) returns null.
 */
export function pairAccessFromMatch(
  match: PairMatchFacts | null,
  viewerId: string,
): PairRole | null {
  if (!match) return null;
  if (match.deletedAt) return null;
  if (match.status !== MatchStatus.ACCEPTED) return null;
  if (viewerId === match.menteeId) return 'mentee';
  if (viewerId === match.mentorId) return 'mentor';
  return null;
}
