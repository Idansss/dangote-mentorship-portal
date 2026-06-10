'use server';

import type { ActionResult } from '@/lib/actions/result';
import {
  archiveFormDefinition,
  createFormDefinition,
  toggleFormDefinitionActive,
  updateFormDefinition,
} from './actions';

// useActionState adapters (prevState, formData) → ActionResult.
export type FormDefinitionFormState = ActionResult<{ id: string }> | null;

export async function createFormDefinitionForm(
  _prev: FormDefinitionFormState,
  formData: FormData,
): Promise<FormDefinitionFormState> {
  return createFormDefinition(formData);
}

export async function updateFormDefinitionForm(
  _prev: FormDefinitionFormState,
  formData: FormData,
): Promise<FormDefinitionFormState> {
  return updateFormDefinition(formData);
}

export async function toggleFormDefinitionActiveForm(
  _prev: FormDefinitionFormState,
  formData: FormData,
): Promise<FormDefinitionFormState> {
  const result = await toggleFormDefinitionActive(formData);
  return result.ok ? { ok: true, data: { id: result.data.id } } : result;
}

export async function archiveFormDefinitionForm(
  _prev: FormDefinitionFormState,
  formData: FormData,
): Promise<FormDefinitionFormState> {
  return archiveFormDefinition(formData);
}
