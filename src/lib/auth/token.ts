import { createHash, randomBytes } from 'node:crypto';

// Generic single-use token helpers (CLAUDE.md §14: store only a hash, never the
// raw token, so a database leak can't be replayed). Used by password reset;
// invite links have their own equivalent in invite.ts.
export function generateToken(bytes = 32): { token: string; tokenHash: string } {
  const token = randomBytes(bytes).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const PASSWORD_RESET_TTL_MINUTES = 60;

export function passwordResetExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60_000);
}
