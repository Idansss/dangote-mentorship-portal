// Idempotent backfill: give every ACTIVE cohort a few real resources and one
// upcoming clinic, so the mentee dashboard's "New resources" and "Upcoming
// clinic" cards render from genuine records (CLAUDE.md §10). Insert-only-if-empty
// — safe to run against an already-seeded database (does NOT reseed anything
// else). Run: tsx --env-file=.env scripts/seed-clinics-resources.ts
import { PrismaClient, CohortStatus, ClinicStatus, Language } from '@prisma/client';

const prisma = new PrismaClient();

function nextFriday16h(): Date {
  const d = new Date();
  d.setUTCHours(16, 0, 0, 0);
  const day = d.getUTCDay(); // 0 Sun … 5 Fri
  let delta = (5 - day + 7) % 7;
  if (delta === 0) delta = 7; // always a future Friday
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

async function main() {
  const cohorts = await prisma.cohort.findMany({
    where: { deletedAt: null, status: CohortStatus.ACTIVE },
    select: { id: true, name: true },
  });
  if (cohorts.length === 0) {
    console.log('No active cohort found — nothing to backfill.');
    return;
  }

  for (const cohort of cohorts) {
    // ── Resources ──
    const resourceCount = await prisma.resource.count({ where: { cohortId: cohort.id, deletedAt: null } });
    if (resourceCount === 0) {
      await prisma.resource.createMany({
        data: [
          { cohortId: cohort.id, title: '2026 Strategy Playbook', category: 'Guide', lang: Language.EN, url: 'https://example.com/resources/strategy-playbook.pdf' },
          { cohortId: cohort.id, title: 'Managing Upwards', category: 'Video', lang: Language.EN, url: 'https://example.com/resources/managing-upwards' },
          { cohortId: cohort.id, title: 'Donner un feedback efficace', category: 'Article', lang: Language.FR, url: 'https://example.com/resources/feedback-efficace' },
        ],
      });
      console.log(`  [${cohort.name}] seeded 3 resources`);
    } else {
      console.log(`  [${cohort.name}] resources already present (${resourceCount}) — skipped`);
    }

    // ── Upcoming clinic ──
    const upcoming = await prisma.clinic.count({
      where: { cohortId: cohort.id, deletedAt: null, status: ClinicStatus.SCHEDULED, scheduledAt: { gte: new Date() } },
    });
    if (upcoming === 0) {
      await prisma.clinic.create({
        data: {
          cohortId: cohort.id,
          title: 'Leadership in Chaos',
          topic: 'Crisis management and rapid scaling',
          scheduledAt: nextFriday16h(),
          joinUrl: 'https://example.com/clinics/leadership-in-chaos',
          status: ClinicStatus.SCHEDULED,
        },
      });
      console.log(`  [${cohort.name}] seeded 1 upcoming clinic`);
    } else {
      console.log(`  [${cohort.name}] upcoming clinic already present — skipped`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
