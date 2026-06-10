/**
 * Read-only smoke check: runs the pure matching engine against the live
 * seeded database and verifies the language hard rule holds on real data.
 * Usage: npx tsx --env-file=.env scripts/smoke-matching.ts
 */
import { PrismaClient } from '@prisma/client';
import { scoreMatch } from '../src/features/matching/engine';

const prisma = new PrismaClient();

async function main() {
  const cohort = await prisma.cohort.findFirstOrThrow({ where: { status: 'ACTIVE' } });

  const mentorProfiles = await prisma.mentorProfile.findMany({
    where: { cohortId: cohort.id },
    include: { competencies: { include: { competency: true } } },
  });
  const menteeProfiles = await prisma.menteeProfile.findMany({
    where: { cohortId: cohort.id },
    include: { competencies: { include: { competency: true } } },
  });

  const mentors = mentorProfiles.map((p) => ({
    id: p.userId,
    cohortId: p.cohortId,
    fullName: p.fullName,
    preferredLanguage: p.preferredLanguage as 'EN' | 'FR',
    yearsExperience: p.yearsExperience,
    department: p.department,
    availability: p.availability,
    personality: p.personality,
    maxMentees: p.maxMentees,
    currentMenteeCount: 0,
    trainingComplete: p.trainingStatus === 'COMPLETED',
    competencies: p.competencies.map((c) => c.competency.name),
    whatCanLearn: p.whatCanLearn,
  }));
  const mentees = menteeProfiles.map((p) => ({
    id: p.userId,
    cohortId: p.cohortId,
    fullName: p.fullName,
    preferredLanguage: p.preferredLanguage as 'EN' | 'FR',
    department: p.department,
    personality: p.personality,
    onboardingComplete: p.trainingStatus === 'COMPLETED',
    careerGoals: p.careerGoals,
    competenciesToStrengthen: p.competencies
      .filter((c) => c.isToStrengthen)
      .map((c) => c.competency.name),
  }));

  let eligible = 0;
  let crossLang = 0;
  let crossLangEligible = 0;
  const scores: number[] = [];

  for (const mentee of mentees) {
    for (const mentor of mentors) {
      const r = scoreMatch(mentor, mentee);
      if (mentor.preferredLanguage !== mentee.preferredLanguage) {
        crossLang += 1;
        if (r.eligible) crossLangEligible += 1;
      }
      if (r.eligible) {
        eligible += 1;
        scores.push(r.score);
      }
    }
  }

  console.log('cohort:', cohort.name);
  console.log('pairs evaluated:', mentors.length * mentees.length);
  console.log('eligible pairs:', eligible);
  console.log(
    'cross-language pairs:',
    crossLang,
    '→ eligible:',
    crossLangEligible,
    crossLangEligible === 0 ? '(IMPOSSIBLE ✓)' : '(VIOLATION!)',
  );
  if (scores.length > 0) {
    console.log('score range:', Math.min(...scores), '-', Math.max(...scores));
  }

  const sample = mentees.find((m) => m.preferredLanguage === 'FR');
  if (sample) {
    const best = mentors
      .map((mentor) => ({ mentor, r: scoreMatch(mentor, sample) }))
      .filter((x) => x.r.eligible)
      .sort((a, b) => b.r.score - a.r.score)[0];
    if (best) {
      console.log(
        `sample FR mentee "${sample.fullName}" → ${best.mentor.fullName} (${best.mentor.preferredLanguage}) score ${best.r.score}`,
      );
      console.log('rationale:', best.r.rationale);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
