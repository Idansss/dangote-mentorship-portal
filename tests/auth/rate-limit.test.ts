import { afterEach, describe, expect, it } from 'vitest';
import {
  clientIpFromHeaders,
  pruneRateLimitBuckets,
  rateLimit,
  resetRateLimitStore,
} from '@/lib/auth/rate-limit';

afterEach(() => resetRateLimitStore());

describe('rateLimit', () => {
  it('allows up to `limit` hits inside the window, then blocks', () => {
    const t0 = 1_000;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit('k', 3, 60_000, t0).ok).toBe(true);
    }
    const blocked = rateLimit('k', 3, 60_000, t0);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('reports decreasing remaining capacity', () => {
    expect(rateLimit('k', 2, 60_000, 0).remaining).toBe(1);
    expect(rateLimit('k', 2, 60_000, 0).remaining).toBe(0);
  });

  it('resets once the window elapses', () => {
    expect(rateLimit('k', 1, 1_000, 0).ok).toBe(true);
    expect(rateLimit('k', 1, 1_000, 500).ok).toBe(false);
    // Window started at 0, resets at 1000.
    expect(rateLimit('k', 1, 1_000, 1_000).ok).toBe(true);
  });

  it('keeps separate keys independent', () => {
    expect(rateLimit('a', 1, 60_000, 0).ok).toBe(true);
    expect(rateLimit('b', 1, 60_000, 0).ok).toBe(true);
    expect(rateLimit('a', 1, 60_000, 0).ok).toBe(false);
  });

  it('prunes expired buckets so a fresh window is granted afterwards', () => {
    expect(rateLimit('k', 1, 1_000, 0).ok).toBe(true); // first hit consumes the window
    pruneRateLimitBuckets(2_000);
    expect(rateLimit('k', 1, 1_000, 2_000).ok).toBe(true);
  });
});

describe('clientIpFromHeaders', () => {
  it('takes the first IP from x-forwarded-for', () => {
    expect(clientIpFromHeaders('203.0.113.1, 10.0.0.1', null)).toBe('203.0.113.1');
  });

  it('falls back to x-real-ip, then to "unknown"', () => {
    expect(clientIpFromHeaders(null, '203.0.113.9')).toBe('203.0.113.9');
    expect(clientIpFromHeaders(null, null)).toBe('unknown');
    expect(clientIpFromHeaders('', '')).toBe('unknown');
  });
});
