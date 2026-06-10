/**
 * One-off: run the validation engine over import rows still in PENDING state
 * (the M0 seed created its messy demo import before the validator existed).
 * Usage: npx tsx --env-file=.env scripts/backfill-import-validation.ts
 */
import { ImportRowStatus, ImportStatus, PrismaClient, Prisma, RoleName } from '@prisma/client';
import { validateRows } from '../src/features/imports/validation';

const prisma = new PrismaClient();

async function main() {
  const imports = await prisma.import.findMany({
    where: { status: ImportStatus.PENDING, deletedAt: null },
    include: { rows: { where: { deletedAt: null }, orderBy: { rowNumber: 'asc' } } },
  });

  for (const imp of imports) {
    const existingProfiles =
      imp.targetRole === RoleName.MENTOR
        ? await prisma.mentorProfile.findMany({
            where: { cohortId: imp.cohortId, deletedAt: null },
            select: { email: true },
          })
        : await prisma.menteeProfile.findMany({
            where: { cohortId: imp.cohortId, deletedAt: null },
            select: { email: true },
          });

    const validated = validateRows(
      imp.rows.map((r) => r.raw as Record<string, unknown>),
      {
        targetRole: imp.targetRole === RoleName.MENTOR ? 'MENTOR' : 'MENTEE',
        existingEmails: new Set(existingProfiles.map((p) => p.email.toLowerCase())),
      },
    );

    let flagged = 0;
    for (let i = 0; i < imp.rows.length; i++) {
      const row = imp.rows[i]!;
      const findings = validated[i]!.findings;
      if (findings.length > 0) flagged += 1;
      await prisma.importRow.update({
        where: { id: row.id },
        data: {
          validation: findings as unknown as Prisma.InputJsonValue,
          status: findings.length === 0 ? ImportRowStatus.VALID : ImportRowStatus.FLAGGED,
        },
      });
    }

    await prisma.import.update({
      where: { id: imp.id },
      data: { status: ImportStatus.VALIDATED, errorCount: flagged },
    });
    console.log(`validated "${imp.fileName}": ${imp.rows.length} rows, ${flagged} flagged`);
  }

  if (imports.length === 0) console.log('no pending imports to backfill');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
