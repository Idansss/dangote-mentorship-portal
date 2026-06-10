// Lightweight fixed-window rate limiter for auth endpoints (CLAUDE.md §14:
// "rate-limit AI and auth endpoints"). The store is in-memory and per-instance,
// which is adequate for a single-node deploy and the Dangote pilot. The function
// signature is deliberately storage-agnostic so the Map can be swapped for
// Redis/Upstash when the app scales horizontally, without touching call sites.
//
// This module imports nothing runtime-specific so it stays pure and unit-testable.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Records one hit against `key` and reports whether it is within `limit` hits
 * per `windowMs`. The first hit of a window starts the clock; the window does
 * not slide, so callers see at most `limit` successes per fixed window.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Drops expired buckets so the in-memory map can't grow without bound. */
export function pruneRateLimitBuckets(now: number = Date.now()): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Test-only: clears all buckets so cases don't bleed into each other. */
export function resetRateLimitStore(): void {
  buckets.clear();
}

/**
 * Best-effort client IP for rate-limit keys, derived from proxy headers. Returns
 * `'unknown'` when no header is present — callers should combine it with another
 * discriminator (e.g. the submitted email) so a missing IP can't collapse every
 * request onto one bucket.
 */
export function clientIpFromHeaders(forwardedFor: string | null, realIp: string | null): string {
  const first = forwardedFor?.split(',')[0]?.trim();
  return first || realIp?.trim() || 'unknown';
}
