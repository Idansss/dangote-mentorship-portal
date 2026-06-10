import { describe, expect, it } from 'vitest';
import {
  generateToken,
  hashToken,
  passwordResetExpiry,
  PASSWORD_RESET_TTL_MINUTES,
} from '@/lib/auth/token';

describe('token util', () => {
  it('hashToken is deterministic and non-reversible (sha256 hex)', () => {
    const h = hashToken('abc');
    expect(h).toBe(hashToken('abc'));
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).not.toContain('abc');
  });

  it('generateToken returns a token whose hash matches tokenHash', () => {
    const { token, tokenHash } = generateToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashToken(token)).toBe(tokenHash);
  });

  it('generates a unique token each call', () => {
    expect(generateToken().token).not.toBe(generateToken().token);
  });

  it('passwordResetExpiry is TTL minutes in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const exp = passwordResetExpiry(now);
    expect(exp.getTime() - now.getTime()).toBe(PASSWORD_RESET_TTL_MINUTES * 60_000);
  });
});
