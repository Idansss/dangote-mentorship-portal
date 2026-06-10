'use server';

import { revalidatePath } from 'next/cache';
import { CohortStatus, Language } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { writeAuditLog } from '@/lib/audit/audit';
import { mapActionError, ok, type ActionResult } from '@/lib/actions/result';
import { archiveCohortSchema, createCohortSchema, updateCohortSchema } from './schema';

function readLanguages(formData: FormData): Language[] {
  return formData.getAll('languages').map((v) => String(v) as Language);
}

export async function createCohort(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const data = createCohortSchema.parse({
      programmeId: formData.get('programmeId'),
      name: formData.get('name'),
      description: formData.get('description') ?? undefined,
      startDate: formData.get('startDate') ?? undefined,
      endDate: formData.get('endDate') ?? undefined,
      languages: readLanguages(formData),
    });

    const cohort = await prisma.cohort.create({
      data: {
        programmeId: data.programmeId,
        name: data.name,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate,
        languages: data.languages,
      },
    });
    await writeAuditLog({
      actorId: actor.id,
      cohortId: cohort.id,
      action: 'cohort.created',
      entityType: 'Cohort',
      entityId: cohort.id,
      metadata: { name: cohort.name, programmeId: cohort.programmeId },
    });

    revalidatePath('/admin/cohorts');
    return ok({ id: cohort.id });
  } catch (error) {
    return mapActionError(error);
  }
}

export async function updateCohort(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const data = updateCohortSchema.parse({
      id: formData.get('id'),
      programmeId: formData.get('programmeId'),
      name: formData.get('name'),
      description: formData.get('description') ?? undefined,
      startDate: formData.get('startDate') ?? undefined,
      endDate: formData.get('endDate') ?? undefined,
      languages: readLanguages(formData),
      status: formData.get('status'),
    });

    await prisma.cohort.update({
      where: { id: data.id },
      data: {
        programmeId: data.programmeId,
        name: data.name,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate,
        languages: data.languages,
        status: data.status,
      },
    });
    await writeAuditLog({
      actorId: actor.id,
      cohortId: data.id,
      action: 'cohort.updated',
      entityType: 'Cohort',
      entityId: data.id,
    });

    revalidatePath('/admin/cohorts');
    return ok({ id: data.id });
  } catch (error) {
    return mapActionError(error);
  }
}

export async function archiveCohort(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(RoleName.SUPER_ADMIN);
    const { id } = archiveCohortSchema.parse({ id: formData.get('id') });

    await prisma.cohort.update({
      where: { id },
      data: { status: CohortStatus.ARCHIVED, deletedAt: new Date() },
    });
    await writeAuditLog({
      actorId: actor.id,
      cohortId: id,
      action: 'cohort.archived',
      entityType: 'Cohort',
      entityId: id,
    });

    revalidatePath('/admin/cohorts');
    return ok({ id });
  } catch (error) {
    return mapActionError(error);
  }
}
