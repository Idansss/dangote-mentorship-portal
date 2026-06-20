'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { writeAuditLog } from '@/lib/audit/audit';
import { mapActionError, ok, type ActionResult } from '@/lib/actions/result';
import { maintenanceModeSchema } from './schema';
import { MAINTENANCE_FLAG_KEY } from './maintenance';

// Toggling maintenance mode locks every non-admin participant out of the app, so
// it is Super-Admin only (CLAUDE.md §4) and every flip is audited.
export async function setMaintenanceMode(
  formData: FormData,
): Promise<ActionResult<{ enabled: boolean }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const { enabled } = maintenanceModeSchema.parse({ enabled: formData.get('enabled') });

    // Global flag (cohortId = null). We can't upsert on the compound unique here:
    // Postgres treats NULLs as distinct, so the [key, cohortId] constraint does
    // NOT dedupe global rows — an upsert could silently create duplicates. Find
    // the existing global row explicitly, then update or create.
    const existing = await prisma.featureFlag.findFirst({
      where: { key: MAINTENANCE_FLAG_KEY, cohortId: null },
      select: { id: true },
    });
    const flag = existing
      ? await prisma.featureFlag.update({
          where: { id: existing.id },
          data: { enabled, deletedAt: null },
        })
      : await prisma.featureFlag.create({
          data: {
            key: MAINTENANCE_FLAG_KEY,
            description: 'When on, only admins can access the portal.',
            enabled,
            cohortId: null,
          },
        });

    await writeAuditLog({
      actorId: actor.id,
      action: enabled ? 'maintenance.enabled' : 'maintenance.disabled',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      metadata: { key: MAINTENANCE_FLAG_KEY, enabled },
    });

    // Re-render the settings page and the participant area gate.
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
    return ok({ enabled });
  } catch (error) {
    return mapActionError(error);
  }
}
