import { describe, expect, it } from 'vitest';
import { MatchStatus } from '@prisma/client';
import { pairAccessFromMatch, type PairMatchFacts } from '@/features/pair/access';

// §1.8: the pair workspace is private to the two people in the accepted pair.
// Like the matching language hard-rule, the access decision is pure and tested:
// no one outside the accepted pair may ever resolve to a role.

const MENTOR = 'mentor-1';
const MENTEE = 'mentee-1';
const STRANGER = 'someone-else';

const accepted: PairMatchFacts = {
  mentorId: MENTOR,
  menteeId: MENTEE,
  status: MatchStatus.ACCEPTED,
};

describe('pairAccessFromMatch', () => {
  it('grants the mentee the mentee role', () => {
    expect(pairAccessFromMatch(accepted, MENTEE)).toBe('mentee');
  });

  it('grants the mentor the mentor role', () => {
    expect(pairAccessFromMatch(accepted, MENTOR)).toBe('mentor');
  });

  it('denies anyone outside the pair', () => {
    expect(pairAccessFromMatch(accepted, STRANGER)).toBeNull();
  });

  it('denies when there is no match', () => {
    expect(pairAccessFromMatch(null, MENTEE)).toBeNull();
  });

  it('denies a match that is not yet accepted', () => {
    expect(pairAccessFromMatch({ ...accepted, status: MatchStatus.SUGGESTED }, MENTEE)).toBeNull();
    expect(pairAccessFromMatch({ ...accepted, status: MatchStatus.REJECTED }, MENTOR)).toBeNull();
  });

  it('denies a soft-deleted match even for its own members', () => {
    expect(pairAccessFromMatch({ ...accepted, deletedAt: new Date() }, MENTEE)).toBeNull();
    expect(pairAccessFromMatch({ ...accepted, deletedAt: new Date() }, MENTOR)).toBeNull();
  });
});
