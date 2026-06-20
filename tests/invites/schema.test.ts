import { describe, expect, it } from 'vitest';
import { createInviteSchema, revokeInviteSchema } from '@/features/invites/schema';

describe('invite schemas', () => {
  it('accepts a valid invite and lowercases the email', () => {
    const parsed = createInviteSchema.parse({
      email: '  New.Mentor@Dangote.com ',
      roleName: 'MENTOR',
      cohortId: undefined,
    });
    expect(parsed.email).toBe('new.mentor@dangote.com');
    expect(parsed.roleName).toBe('MENTOR');
    expect(parsed.cohortId).toBeNull();
  });

  it('treats an empty cohort selection as a global grant', () => {
    const parsed = createInviteSchema.parse({ email: 'a@b.com', roleName: 'MENTEE', cohortId: '' });
    expect(parsed.cohortId).toBeNull();
  });

  it('rejects invalid emails, unknown roles, and malformed cohort ids', () => {
    expect(createInviteSchema.safeParse({ email: 'not-an-email', roleName: 'MENTOR' }).success).toBe(
      false,
    );
    expect(createInviteSchema.safeParse({ email: 'a@b.com', roleName: 'GOD_MODE' }).success).toBe(
      false,
    );
    expect(
      createInviteSchema.safeParse({ email: 'a@b.com', roleName: 'MENTOR', cohortId: '123' }).success,
    ).toBe(false);
  });

  it('requires a cuid to revoke', () => {
    expect(revokeInviteSchema.safeParse({ id: 'nope' }).success).toBe(false);
  });
});
