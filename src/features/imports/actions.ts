'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  ImportRowStatus,
  ImportStatus,
  Language,
  MatchingStatus,
  Prisma,
  RoleName,
  TrainingStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { writeAuditLog } from '@/lib/audit/audit';
import { mapActionError, ok, fail, type ActionResult } from '@/lib/actions/result';
import { parseSheetBuffer } from './parse';
import {
  cleanRow,
  hasBlockingErrors,
  validateRows,
  validateRow,
  type CleanRow,
  type Finding,
} from './validation';

const ADMIN: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.PROGRAMME_ADMIN];

const uploadSchema = z.object({
  cohortId: z.string().cuid(),
  targetRole: z.enum([RoleName.MENTOR, RoleName.MENTEE]),
});

async function existingCohortEmails(cohortId: string, role: RoleName): Promise<Set<string>> {
  if (role === RoleName.MENTOR) {
    const profiles = await prisma.mentorProfile.findMany({
      where: { cohortId, deletedAt: null },
      select: { email: true },
    });
    return new Set(profiles.map((p) => p.email.toLowerCase()));
  }
  const profiles = await prisma.menteeProfile.findMany({
    where: { cohortId, deletedAt: null },
    select: { email: true },
  });
  return new Set(profiles.map((p) => p.email.toLowerCase()));
}

/** Upload a mentor/mentee sheet, validate every row, and open the review screen. */
export async function uploadImport(formData: FormData): Promise<ActionResult<{ id: string }>> {
  let importId: string;
  try {
    const actor = await requireRole(ADMIN);
    const { cohortId, targetRole } = uploadSchema.parse({
      cohortId: formData.get('cohortId'),
      targetRole: formData.get('targetRole'),
    });

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return fail({ code: 'VALIDATION', message: 'Choose a .csv or .xlsx file to upload.' });
    }

    const { sourceType, rows } = parseSheetBuffer(await file.arrayBuffer(), file.name);
    if (rows.length === 0) {
      return fail({ code: 'VALIDATION', message: 'The file contains no data rows.' });
    }

    const existing = await existingCohortEmails(cohortId, targetRole);
    const validated = validateRows(rows, {
      targetRole: targetRole === RoleName.MENTOR ? 'MENTOR' : 'MENTEE',
      existingEmails: existing,
    });

    const errorCount = validated.filter((v) => v.findings.length > 0).length;

    const imported = await prisma.import.create({
      data: {
        cohortId,
        uploadedById: actor.id,
        fileName: file.name,
        sourceType,
        status: ImportStatus.VALIDATED,
        targetRole,
        rowCount: rows.length,
        errorCount,
        rows: {
          create: validated.map((v, idx) => ({
            rowNumber: idx + 1,
            raw: rows[idx] as Prisma.InputJsonValue,
            status: v.findings.length === 0 ? ImportRowStatus.VALID : ImportRowStatus.FLAGGED,
            validation: v.findings as unknown as Prisma.InputJsonValue,
          })),
        },
      },
    });

    await writeAuditLog({
      actorId: actor.id,
      cohortId,
      action: 'import.uploaded',
      entityType: 'Import',
      entityId: imported.id,
      metadata: { fileName: file.name, rows: rows.length, flagged: errorCount, targetRole },
    });

    importId = imported.id;
  } catch (error) {
    return mapActionError(error);
  }
  redirect(`/admin/imports/${importId}`);
}

// Void wrappers for plain RSC <form action> usage (which requires
// void-returning actions). The typed variants stay the canonical API.
export async function fixImportRowForm(formData: FormData): Promise<void> {
  await fixImportRow(formData);
}

export async function setImportRowStatusForm(formData: FormData): Promise<void> {
  await setImportRowStatus(formData);
}

export async function commitImportForm(formData: FormData): Promise<void> {
  await commitImport(formData);
}

const fixRowSchema = z.object({
  rowId: z.string().cuid(),
  fullName: z.string().trim().max(160),
  email: z.string().trim().max(320),
  language: z.string().trim().max(20),
  department: z.string().trim().max(120),
  jobTitle: z.string().trim().max(120),
  yearsExperience: z.string().trim().max(20),
  competencies: z.string().trim().max(500),
  careerGoals: z.string().trim().max(1000),
});

/** Admin fixes a flagged row inline; the row is re-validated immediately. */
export async function fixImportRow(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(ADMIN);
    const data = fixRowSchema.parse(Object.fromEntries(formData));

    const row = await prisma.importRow.findUniqueOrThrow({
      where: { id: data.rowId },
      include: { import: true },
    });

    // Overwrite with canonical headers; cleanRow maps them back.
    const raw = {
      'Full Name': data.fullName,
      Email: data.email,
      Language: data.language,
      Department: data.department,
      'Job Title': data.jobTitle,
      'Years of Experience': data.yearsExperience,
      Competencies: data.competencies,
      'Career Goals': data.careerGoals,
    };

    const clean = cleanRow(raw);
    const existing = await existingCohortEmails(row.import.cohortId, row.import.targetRole);
    const findings = validateRow(clean, {
      targetRole: row.import.targetRole === RoleName.MENTOR ? 'MENTOR' : 'MENTEE',
      existingEmails: existing,
      seenEmailsInFile: new Set(), // in-file duplicates were resolved at upload time
    });

    await prisma.importRow.update({
      where: { id: row.id },
      data: {
        raw: raw as Prisma.InputJsonValue,
        validation: findings as unknown as Prisma.InputJsonValue,
        status: findings.length === 0 ? ImportRowStatus.FIXED : ImportRowStatus.FLAGGED,
      },
    });

    await writeAuditLog({
      actorId: actor.id,
      cohortId: row.import.cohortId,
      action: 'import.row_fixed',
      entityType: 'ImportRow',
      entityId: row.id,
      metadata: { importId: row.importId, remainingFindings: findings.length },
    });

    revalidatePath(`/admin/imports/${row.importId}`);
    return ok({ id: row.id });
  } catch (error) {
    return mapActionError(error);
  }
}

const rowStatusSchema = z.object({
  rowId: z.string().cuid(),
  status: z.enum([ImportRowStatus.ACCEPTED, ImportRowStatus.REJECTED]),
});

/** Admin accepts a row despite warnings, or rejects it outright. */
export async function setImportRowStatus(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireRole(ADMIN);
    const { rowId, status } = rowStatusSchema.parse({
      rowId: formData.get('rowId'),
      status: formData.get('status'),
    });

    const row = await prisma.importRow.findUniqueOrThrow({
      where: { id: rowId },
      include: { import: true },
    });

    // Rows with blocking errors cannot be accepted — they must be fixed first.
    if (status === ImportRowStatus.ACCEPTED) {
      const findings = (row.validation ?? []) as unknown as Finding[];
      if (hasBlockingErrors(findings)) {
        return fail({
          code: 'CONFLICT',
          message: 'This row has blocking errors. Fix them before accepting.',
        });
      }
    }

    await prisma.importRow.update({ where: { id: rowId }, data: { status } });
    await writeAuditLog({
      actorId: actor.id,
      cohortId: row.import.cohortId,
      action: status === ImportRowStatus.ACCEPTED ? 'import.row_accepted' : 'import.row_rejected',
      entityType: 'ImportRow',
      entityId: rowId,
    });

    revalidatePath(`/admin/imports/${row.importId}`);
    return ok({ id: rowId });
  } catch (error) {
    return mapActionError(error);
  }
}

const commitSchema = z.object({ importId: z.string().cuid() });

function localeFromLanguage(lang: CleanRow['language']): Language {
  return lang === 'FR' ? Language.FR : Language.EN;
}

/**
 * Commit an import: every committable row (valid, fixed, or explicitly
 * accepted — never rejected, never still carrying blocking errors) becomes a
 * user + profile. A human reviewed every flag before this point (§11).
 */
export async function commitImport(formData: FormData): Promise<ActionResult<{ created: number }>> {
  try {
    const actor = await requireRole(ADMIN);
    const { importId } = commitSchema.parse({ importId: formData.get('importId') });

    const imported = await prisma.import.findUniqueOrThrow({
      where: { id: importId },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    });

    if (imported.status === ImportStatus.COMMITTED) {
      return fail({ code: 'CONFLICT', message: 'This import has already been committed.' });
    }

    const committable = imported.rows.filter((row) => {
      if (row.status === ImportRowStatus.REJECTED) return false;
      const findings = (row.validation ?? []) as unknown as Finding[];
      if (hasBlockingErrors(findings)) return false;
      return (
        row.status === ImportRowStatus.VALID ||
        row.status === ImportRowStatus.FIXED ||
        row.status === ImportRowStatus.ACCEPTED
      );
    });

    const role = await prisma.role.findUniqueOrThrow({ where: { name: imported.targetRole } });
    let created = 0;

    for (const row of committable) {
      const clean = cleanRow(row.raw as Record<string, unknown>);
      if (!clean.email || !clean.fullName) continue; // belt-and-braces; validation already blocks these

      const user = await prisma.user.upsert({
        where: { email: clean.email },
        update: {},
        create: { email: clean.email, name: clean.fullName, locale: localeFromLanguage(clean.language) },
      });

      const grant = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: role.id, cohortId: imported.cohortId },
      });
      if (!grant) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: role.id, cohortId: imported.cohortId },
        });
      }

      const profileData = {
        cohortId: imported.cohortId,
        fullName: clean.fullName,
        email: clean.email,
        phone: clean.phone || null,
        department: clean.department || null,
        jobTitle: clean.jobTitle || null,
        location: clean.location || null,
        preferredLanguage: localeFromLanguage(clean.language),
        personality: clean.personality || null,
        trainingStatus: TrainingStatus.NOT_STARTED,
        matchingStatus: MatchingStatus.UNMATCHED,
      };

      let profileId: string | null = null;
      let isMentorProfile = false;
      if (imported.targetRole === RoleName.MENTOR) {
        const existing = await prisma.mentorProfile.findUnique({ where: { userId: user.id } });
        if (existing) continue; // duplicate accepted as warning → skip, never clobber
        const profile = await prisma.mentorProfile.create({
          data: {
            userId: user.id,
            ...profileData,
            yearsExperience: clean.yearsExperience === null ? null : Math.trunc(clean.yearsExperience),
            whyMentor: clean.whyText || null,
            availability: clean.availability || null,
            maxMentees: clean.maxMentees ?? 2,
          },
        });
        profileId = profile.id;
        isMentorProfile = true;
      } else {
        const existing = await prisma.menteeProfile.findUnique({ where: { userId: user.id } });
        if (existing) continue;
        const profile = await prisma.menteeProfile.create({
          data: {
            userId: user.id,
            ...profileData,
            whyMentor: clean.whyText || null,
            careerGoals: clean.careerGoals || null,
          },
        });
        profileId = profile.id;
      }

      // Competency names from the sheet: create in the cohort taxonomy as
      // GENERAL (admin can reclassify later) and link to the profile.
      for (const name of clean.competencies) {
        const competency = await prisma.competency.upsert({
          where: { cohortId_name_type: { cohortId: imported.cohortId, name, type: 'GENERAL' } },
          update: {},
          create: { cohortId: imported.cohortId, name, type: 'GENERAL' },
        });
        await prisma.profileCompetency.create({
          data: isMentorProfile
            ? { competencyId: competency.id, mentorProfileId: profileId }
            : { competencyId: competency.id, menteeProfileId: profileId, isToStrengthen: true },
        });
      }

      created += 1;
    }

    await prisma.import.update({
      where: { id: importId },
      data: { status: ImportStatus.COMMITTED },
    });
    await writeAuditLog({
      actorId: actor.id,
      cohortId: imported.cohortId,
      action: 'import.committed',
      entityType: 'Import',
      entityId: importId,
      metadata: { createdProfiles: created, totalRows: imported.rowCount },
    });

    revalidatePath(`/admin/imports/${importId}`);
    revalidatePath('/admin/imports');
    return ok({ created });
  } catch (error) {
    return mapActionError(error);
  }
}
