import { createHash, randomBytes } from 'node:crypto';

// Invite links (CLAUDE.md §2). We store only a hash of the token, never the raw
// value, so a database leak cannot be used to accept invites.
export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const INVITE_TTL_DAYS = 14;

export function inviteExpiry(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
}
