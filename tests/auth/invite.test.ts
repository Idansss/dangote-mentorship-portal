import { describe, expect, it } from 'vitest';
import { generateInviteToken, hashInviteToken, inviteExpiry } from '@/lib/auth/invite';

describe('invite tokens', () => {
  it('hashes the token deterministically and never stores the raw value', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(token).not.toEqual(tokenHash);
    expect(hashInviteToken(token)).toEqual(tokenHash);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/); // sha-256 hex
  });

  it('produces unique tokens', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a.token).not.toEqual(b.token);
  });

  it('sets an expiry in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(inviteExpiry(now).getTime()).toBeGreaterThan(now.getTime());
  });
});
