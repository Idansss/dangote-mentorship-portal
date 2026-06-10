import { describe, expect, it } from 'vitest';
import { canMentorSee, canOwnerSee } from '@/features/reflections/visibility';

// §1.16 confidentiality is the safety-critical rule for this feature, analogous
// to the matching language hard-rule: a reflection must never reach a mentor
// unless the author explicitly shared it AND the mentor is that author's mentor.

const MENTEE_A = 'mentee-a';
const MENTEE_B = 'mentee-b';
const STRANGER = 'mentee-x';
const mentorsMentees = [MENTEE_A, MENTEE_B];

describe('canOwnerSee', () => {
  it('lets the author see their own non-deleted entry', () => {
    expect(canOwnerSee({ authorId: MENTEE_A, isSharedWithMentor: false }, MENTEE_A)).toBe(true);
  });

  it('hides another user’s entry, and any deleted entry', () => {
    expect(canOwnerSee({ authorId: MENTEE_A, isSharedWithMentor: true }, MENTEE_B)).toBe(false);
    expect(
      canOwnerSee({ authorId: MENTEE_A, isSharedWithMentor: false, deletedAt: new Date() }, MENTEE_A),
    ).toBe(false);
  });
});

describe('canMentorSee', () => {
  it('shows a shared entry authored by one of the mentor’s mentees', () => {
    expect(canMentorSee({ authorId: MENTEE_A, isSharedWithMentor: true }, mentorsMentees)).toBe(true);
  });

  it('NEVER shows an unshared entry, even from the mentor’s own mentee', () => {
    expect(canMentorSee({ authorId: MENTEE_A, isSharedWithMentor: false }, mentorsMentees)).toBe(false);
  });

  it('NEVER shows a shared entry authored by someone who is not their mentee', () => {
    expect(canMentorSee({ authorId: STRANGER, isSharedWithMentor: true }, mentorsMentees)).toBe(false);
  });

  it('NEVER shows a deleted entry, even if shared and from a mentee', () => {
    expect(
      canMentorSee(
        { authorId: MENTEE_A, isSharedWithMentor: true, deletedAt: new Date() },
        mentorsMentees,
      ),
    ).toBe(false);
  });

  it('shows nothing to a mentor with no mentees', () => {
    expect(canMentorSee({ authorId: MENTEE_A, isSharedWithMentor: true }, [])).toBe(false);
  });
});
