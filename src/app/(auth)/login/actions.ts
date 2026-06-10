'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth/auth';

export type LoginState = { error?: string };

// Credentials sign-in (email/password fallback — CLAUDE.md §2). On success
// signIn throws a redirect to /dashboard, which then routes the user to their
// role-correct dashboard. AuthError → friendly message; other errors rethrow.
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
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
