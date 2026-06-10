// Fixed-window rate limiter for auth endpoints (CLAUDE.md §14: "rate-limit AI
// and auth endpoints"). Storage is behind the RateLimitStore seam so the
// default in-memory (per-instance) store can be swapped for a shared one when
// the app scales horizontally — without touching call sites.
//
// Swapping to Redis/Upstash: implement RateLimitStore against it (their atomic
// INCR + EXPIRE map cleanly onto a bucket) and call setRateLimitStore() at boot.
// A network store is async, so that swap also makes rateLimit() async — at which
// point the two callers (login + invite/reset actions) add an `await`.
//
// This module imports nothing runtime-specific so it stays pure and unit-testable.

export interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  get(key: string): Bucket | undefined;
  set(key: string, bucket: Bucket): void;
  delete(key: string): void;
  clear(): void;
  prune(now: number): void;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  get(key: string): Bucket | undefined {
    return this.buckets.get(key);
  }
  set(key: string, bucket: Bucket): void {
    this.buckets.set(key, bucket);
  }
  delete(key: string): void {
    this.buckets.delete(key);
  }
  clear(): void {
    this.buckets.clear();
  }
  prune(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

let store: RateLimitStore = new InMemoryRateLimitStore();

/** Replaces the active store (e.g. a Redis-backed one) at application boot. */
export function setRateLimitStore(next: RateLimitStore): void {
  store = next;
}

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
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  store.set(key, existing);
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Drops expired buckets so an in-memory store can't grow without bound. */
export function pruneRateLimitBuckets(now: number = Date.now()): void {
  store.prune(now);
}

/** Test-only: clears all buckets so cases don't bleed into each other. */
export function resetRateLimitStore(): void {
  store.clear();
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
