'use server';

import { revalidatePath } from 'next/cache';
import { ProgrammeStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { writeAuditLog } from '@/lib/audit/audit';
import { mapActionError, ok, type ActionResult } from '@/lib/actions/result';
import { archiveProgrammeSchema, createProgrammeSchema, updateProgrammeSchema } from './schema';

// Programme CRUD is Super-Admin-only (CLAUDE.md §4: "Manage platform/cohorts").
// Every action: authenticate → authorize → validate → execute → audit.

export async function createProgramme(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const data = createProgrammeSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') ?? undefined,
    });

    const programme = await prisma.programme.create({
      data: { name: data.name, description: data.description || null },
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'programme.created',
      entityType: 'Programme',
      entityId: programme.id,
      metadata: { name: programme.name },
    });

    revalidatePath('/admin/programmes');
    return ok({ id: programme.id });
  } catch (error) {
    return mapActionError(error);
  }
}

export async function updateProgramme(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const data = updateProgrammeSchema.parse({
      id: formData.get('id'),
      name: formData.get('name'),
      description: formData.get('description') ?? undefined,
      status: formData.get('status'),
    });

    await prisma.programme.update({
      where: { id: data.id },
      data: { name: data.name, description: data.description || null, status: data.status },
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'programme.updated',
      entityType: 'Programme',
      entityId: data.id,
    });

    revalidatePath('/admin/programmes');
    return ok({ id: data.id });
  } catch (error) {
    return mapActionError(error);
  }
}

export async function archiveProgramme(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const { id } = archiveProgrammeSchema.parse({ id: formData.get('id') });

    // Soft-delete (CLAUDE.md §3): never hard-delete; mark archived + deletedAt.
    await prisma.programme.update({
      where: { id },
      data: { status: ProgrammeStatus.ARCHIVED, deletedAt: new Date() },
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'programme.archived',
      entityType: 'Programme',
      entityId: id,
    });

    revalidatePath('/admin/programmes');
    return ok({ id });
  } catch (error) {
    return mapActionError(error);
  }
}
