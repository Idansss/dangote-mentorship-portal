'use server';

import type { ActionResult } from '@/lib/actions/result';
import { createInvite, revokeInvite } from './actions';

// useActionState adapters (prevState, formData) → ActionResult.

export type InviteFormState = ActionResult<{ id: string; token: string }> | null;

export async function createInviteForm(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  return createInvite(formData);
}

export type RevokeInviteState = ActionResult<{ id: string }> | null;

export async function revokeInviteForm(
  _prev: RevokeInviteState,
  formData: FormData,
): Promise<RevokeInviteState> {
  return revokeInvite(formData);
}
