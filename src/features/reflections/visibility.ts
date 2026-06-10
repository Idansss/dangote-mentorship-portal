// Pure visibility rules for the reflection journal (experience-layer.md §1.16).
// Confidentiality posture mirrors DMs (CLAUDE.md §7, §16): a reflection is private
// to its author and becomes visible to the mentor ONLY when the author has
// explicitly shared it AND the mentor is that author's accepted mentor. Admins are
// never a viewer here. Kept pure and unit-tested as the safety-critical rule.

export interface ReflectionVisibility {
  authorId: string;
  isSharedWithMentor: boolean;
  deletedAt?: Date | null;
}

/** The author always sees their own (non-deleted) entry. */
export function canOwnerSee(entry: ReflectionVisibility, viewerId: string): boolean {
  return !entry.deletedAt && entry.authorId === viewerId;
}

/**
 * A mentor sees a reflection only when it is explicitly shared and authored by one
 * of their accepted mentees. Anything unshared, deleted, or authored by someone
 * who is not their mentee is invisible — no exceptions, no admin override here.
 */
export function canMentorSee(
  entry: ReflectionVisibility,
  mentorMenteeIds: readonly string[],
): boolean {
  return (
    !entry.deletedAt &&
    entry.isSharedWithMentor &&
    mentorMenteeIds.includes(entry.authorId)
  );
}
