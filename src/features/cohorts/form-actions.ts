'use server';

import type { ActionResult } from '@/lib/actions/result';
import { archiveCohort, createCohort, updateCohort } from './actions';

// useActionState adapters (prevState, formData) → ActionResult.
export type CohortFormState = ActionResult<{ id: string }> | null;

export async function createCohortForm(
  _prev: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  return createCohort(formData);
}

export async function updateCohortForm(
  _prev: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  return updateCohort(formData);
}

export async function archiveCohortForm(
  _prev: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  return archiveCohort(formData);
}
