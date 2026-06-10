'use server';

import { signIn, signOut } from './auth';

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

export async function signInWithEntra(): Promise<void> {
  await signIn('microsoft-entra-id', { redirectTo: '/dashboard' });
}
