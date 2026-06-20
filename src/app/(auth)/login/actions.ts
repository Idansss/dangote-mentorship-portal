'use server';

import { headers } from 'next/headers';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth/auth';
import { clientIpFromHeaders } from '@/lib/auth/rate-limit';
import { checkRateLimit } from '@/lib/auth/rate-limit-shared';

export type LoginState = { error?: 'invalid' | 'rate_limited' };

// Throttle credential sign-in to blunt password guessing (CLAUDE.md §14).
// Keyed by IP + email so one attacker can't lock out an unrelated account and a
// missing proxy IP can't collapse everyone onto a single bucket.
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

// Credentials sign-in (email/password fallback — CLAUDE.md §2). On success
// signIn throws a redirect to /dashboard, which then routes the user to their
// role-correct dashboard. AuthError → friendly message; other errors rethrow.
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').toLowerCase();

  const h = await headers();
  const ip = clientIpFromHeaders(h.get('x-forwarded-for'), h.get('x-real-ip'));
  const limit = await checkRateLimit(`login:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.ok) return { error: 'rate_limited' };

  try {
    await signIn('credentials', {
      email,
      password: String(formData.get('password') ?? ''),
      redirectTo: '/dashboard',
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'invalid' };
    }
    throw error;
  }
}
