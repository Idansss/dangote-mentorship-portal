'use server';

import type { ActionResult } from '@/lib/actions/result';
import { setMaintenanceMode } from './actions';

// useActionState adapter (prevState, formData) → ActionResult.
export type MaintenanceFormState = ActionResult<{ enabled: boolean }> | null;

export async function setMaintenanceModeForm(
  _prev: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  return setMaintenanceMode(formData);
}
