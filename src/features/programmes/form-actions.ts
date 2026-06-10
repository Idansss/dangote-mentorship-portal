'use server';

import type { ActionResult } from '@/lib/actions/result';
import { archiveProgramme, createProgramme, updateProgramme } from './actions';

// useActionState adapters (prevState, formData) → ActionResult.
export type ProgrammeFormState = ActionResult<{ id: string }> | null;

export async function createProgrammeForm(
  _prev: ProgrammeFormState,
  formData: FormData,
): Promise<ProgrammeFormState> {
  return createProgramme(formData);
}

export async function updateProgrammeForm(
  _prev: ProgrammeFormState,
  formData: FormData,
): Promise<ProgrammeFormState> {
  return updateProgramme(formData);
}

export async function archiveProgrammeForm(
  _prev: ProgrammeFormState,
  formData: FormData,
): Promise<ProgrammeFormState> {
  return archiveProgramme(formData);
}
