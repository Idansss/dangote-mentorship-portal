/**
 * Seed a realistic bilingual demo cohort (CLAUDE.md §3).
 *  - the six roles + a Super Admin, Programme Admin, Trainer, Reviewer
 *  - Programme "Dangote Mentorship Programme 2026" + an active 2026 cohort
 *  - default matching criteria + a bilingual competency taxonomy
 *  - 15 mentors and 30 mentees, mixed EN/FR, varied departments/competencies
 *  - one mentor import with a few intentionally messy rows for M1's validator
 *
 * Idempotent: safe to run repeatedly. Run with `npm run db:seed`.
 */
import {
  AttendanceStatus,
  CohortStatus,
  CompetencyType,
  ImportSourceType,
  ImportStatus,
  ImportRowStatus,
  InviteStatus,
  Language,
  PrismaClient,
  ProgrammeStatus,
  RoleName,
  TrainingStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateInviteToken, inviteExpiry } from '../src/lib/auth/invite';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'ChangeMe!2026';
const SUPER_ADMIN_EMAIL = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@dangote.com').toLowerCase();

const GENERAL_COMPETENCIES = [
  'Leadership',
  'Communication',
  'Strategic Thinking',
  'Stakeholder Management',
  'Decision Making',
  'Emotional Intelligence',
  'Team Building',
  'Time Management',
];

const TECHNICAL_COMPETENCIES = [
  'Process Engineering',
  'Financial Analysis',
  'Supply Chain Optimization',
  'Data Analytics',
  'Project Management',
  'Safety & HSE',
  'Quality Control',
  'Maintenance Engineering',
];

const EN_DEPARTMENTS = ['Cement', 'Sugar', 'Salt', 'Fertilizer', 'Refinery', 'Logistics', 'Finance', 'IT'];
const EN_LOCATIONS = ['Lagos', 'Abuja', 'Kano', 'Ibese', 'Obajana', 'Port Harcourt'];
const FR_LOCATIONS = ['Dakar', 'Douala', 'Abidjan', 'Lomé'];

const FIRST_NAMES = [
  'Aisha', 'Chidi', 'Ngozi', 'Emeka', 'Fatima', 'Tunde', 'Amara', 'Yusuf', 'Zainab', 'Kwame',
  'Adaeze', 'Ibrahim', 'Bola', 'Chinedu', 'Halima', 'Segun', 'Ifeoma', 'Musa', 'Folake', 'Obi',
  'Mariam', 'Uche', 'Sani', 'Blessing', 'Olu', 'Hadiza', 'Kelechi', 'Aminata', 'Femi', 'Grace',
  'Idris', 'Chiamaka', 'Sadio', 'Ousmane', 'Aminu', 'Ngor', 'Mamadou', 'Awa', 'Cheikh', 'Binta',
  'Kofi', 'Esi', 'Yaw', 'Abena', 'Kojo', 'Adwoa',
];
const LAST_NAMES = [
  'Okafor', 'Adeyemi', 'Bello', 'Eze', 'Ogunleye', 'Mohammed', 'Nwosu', 'Diallo', 'Sow', 'Ndiaye',
  'Traoré', 'Koné', 'Mensah', 'Owusu', 'Abubakar', 'Okonkwo', 'Balogun', 'Sani', 'Adeleke', 'Obi',
];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

async function hash(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

async function ensureRoles(): Promise<Record<RoleName, string>> {
  const map = {} as Record<RoleName, string>;
  for (const name of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
    map[name] = role.id;
  }
  return map;
}

async function ensureUser(opts: {
  email: string;
  name: string;
  locale: Language;
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: opts.email },
    update: { name: opts.name, locale: opts.locale },
    create: {
      email: opts.email,
      name: opts.name,
      locale: opts.locale,
      passwordHash: opts.passwordHash,
      emailVerified: new Date(),
    },
  });
}

async function grantRole(userId: string, roleId: string, cohortId: string | null) {
  // Can't upsert on the compound unique here: cohortId is nullable and Postgres
  // treats NULLs as distinct, so look up explicitly then create/restore.
  const existing = await prisma.userRole.findFirst({ where: { userId, roleId, cohortId } });
  if (existing) {
    if (existing.deletedAt) {
      await prisma.userRole.update({ where: { id: existing.id }, data: { deletedAt: null } });
    }
    return;
  }
  await prisma.userRole.create({ data: { userId, roleId, cohortId } });
}

async function main() {
  console.log('Seeding demo cohort…');
  const passwordHash = await hash(DEFAULT_PASSWORD);
  const roles = await ensureRoles();

  // --- Super Admin (global role grant) ------------------------------------
  const superAdmin = await ensureUser({
    email: SUPER_ADMIN_EMAIL,
    name: 'Super Admin',
    locale: Language.EN,
    passwordHash,
  });
  await grantRole(superAdmin.id, roles.SUPER_ADMIN, null);

  // --- Programme + cohort --------------------------------------------------
  const existingProgramme = await prisma.programme.findFirst({
    where: { name: 'Dangote Mentorship Programme 2026', deletedAt: null },
  });
  const programme =
    existingProgramme ??
    (await prisma.programme.create({
      data: {
        name: 'Dangote Mentorship Programme 2026',
        description: 'The 2026 bilingual (EN/FR) mentorship cohort for Dangote Group.',
        status: ProgrammeStatus.ACTIVE,
      },
    }));

  const existingCohort = await prisma.cohort.findFirst({
    where: { programmeId: programme.id, name: 'Cohort 2026 (Jan–Sep)', deletedAt: null },
  });
  const cohort =
    existingCohort ??
    (await prisma.cohort.create({
      data: {
        programmeId: programme.id,
        name: 'Cohort 2026 (Jan–Sep)',
        description: 'January–September 2026 · EN + FR · training batches A/B/C.',
        status: CohortStatus.ACTIVE,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-09-30'),
        languages: [Language.EN, Language.FR],
        retentionDays: 1095,
      },
    }));

  // --- Default matching criteria (CLAUDE.md §8) ----------------------------
  const criteria = await prisma.matchingCriteria.findFirst({ where: { cohortId: cohort.id } });
  if (!criteria) {
    await prisma.matchingCriteria.create({
      data: {
        cohortId: cohort.id,
        weights: {
          competency: 30,
          careerGoal: 25,
          experience: 20,
          department: 10,
          availability: 10,
          personality: 5,
        },
        hardRules: {
          languageMustMatch: true,
          mentorMustHaveCapacity: true,
          mentorTrainingComplete: true,
          enforceDifferentReportingLine: false,
          enforceNoConflictOfInterest: false,
        },
      },
    });
  }

  // --- Competency taxonomy -------------------------------------------------
  const competencyIds: Record<string, string> = {};
  for (const name of GENERAL_COMPETENCIES) {
    const c = await prisma.competency.upsert({
      where: { cohortId_name_type: { cohortId: cohort.id, name, type: CompetencyType.GENERAL } },
      update: {},
      create: { cohortId: cohort.id, name, type: CompetencyType.GENERAL },
    });
    competencyIds[`G:${name}`] = c.id;
  }
  for (const name of TECHNICAL_COMPETENCIES) {
    const c = await prisma.competency.upsert({
      where: { cohortId_name_type: { cohortId: cohort.id, name, type: CompetencyType.TECHNICAL } },
      update: {},
      create: { cohortId: cohort.id, name, type: CompetencyType.TECHNICAL },
    });
    competencyIds[`T:${name}`] = c.id;
  }

  // --- Staff demo accounts -------------------------------------------------
  const progAdmin = await ensureUser({
    email: 'prog.admin@dangote.com',
    name: 'Programme Admin',
    locale: Language.EN,
    passwordHash,
  });
  await grantRole(progAdmin.id, roles.PROGRAMME_ADMIN, cohort.id);

  const trainer = await ensureUser({
    email: 'trainer@dangote.com',
    name: 'Training Facilitator',
    locale: Language.EN,
    passwordHash,
  });
  await grantRole(trainer.id, roles.TRAINER, cohort.id);

  const reviewer = await ensureUser({
    email: 'reviewer@dangote.com',
    name: 'HR L&D Reviewer',
    locale: Language.EN,
    passwordHash,
  });
  await grantRole(reviewer.id, roles.REVIEWER, cohort.id);

  // --- Training batch so attendance/training-status are demoable -----------
  const batch =
    (await prisma.trainingBatch.findFirst({ where: { cohortId: cohort.id, name: 'Batch A' } })) ??
    (await prisma.trainingBatch.create({
      data: {
        cohortId: cohort.id,
        name: 'Batch A',
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-02-07'),
      },
    }));

  // --- Mentors -------------------------------------------------------------
  const MENTOR_COUNT = 15;
  for (let i = 0; i < MENTOR_COUNT; i++) {
    const isFr = i % 3 === 2; // ~1/3 French speakers
    const locale = isFr ? Language.FR : Language.EN;
    const first = pick(FIRST_NAMES, i);
    const last = pick(LAST_NAMES, i + 3);
    const email = `mentor.${first}.${last}.${i}@dangote.com`.toLowerCase();
    const user = await ensureUser({ email, name: `${first} ${last}`, locale, passwordHash });
    await grantRole(user.id, roles.MENTOR, cohort.id);

    // A handful of mentors are left intentionally light on data so the M3 risk
    // monitor and M1 validator have something to flag.
    const sparse = i % 7 === 0;
    const profile = await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        cohortId: cohort.id,
        fullName: `${first} ${last}`,
        email,
        phone: sparse ? null : `+2348${(10000000 + i).toString().slice(0, 8)}`,
        department: pick(EN_DEPARTMENTS, i),
        jobTitle: 'Senior Manager',
        location: isFr ? pick(FR_LOCATIONS, i) : pick(EN_LOCATIONS, i),
        preferredLanguage: locale,
        yearsExperience: 10 + (i % 12),
        currentRole: 'Senior Manager',
        whyMentor: sparse ? null : 'I want to develop the next generation of Dangote leaders.',
        personality: pick(['Analytical', 'Driver', 'Amiable', 'Expressive'], i),
        whatCanLearn: 'Operational leadership and stakeholder management.',
        maxMentees: 2 + (i % 3),
        trainingStatus: i % 4 === 0 ? TrainingStatus.IN_PROGRESS : TrainingStatus.COMPLETED,
      },
    });

    // Attach 2 general + 1 technical competency.
    const g1 = competencyIds[`G:${pick(GENERAL_COMPETENCIES, i)}`]!;
    const t1 = competencyIds[`T:${pick(TECHNICAL_COMPETENCIES, i)}`]!;
    for (const competencyId of [g1, t1]) {
      const exists = await prisma.profileCompetency.findFirst({
        where: { mentorProfileId: profile.id, competencyId },
      });
      if (!exists) {
        await prisma.profileCompetency.create({
          data: { mentorProfileId: profile.id, competencyId },
        });
      }
    }

    await prisma.trainingAttendance.upsert({
      where: { batchId_userId: { batchId: batch.id, userId: user.id } },
      update: {},
      create: {
        batchId: batch.id,
        userId: user.id,
        status: i % 4 === 0 ? AttendanceStatus.REGISTERED : AttendanceStatus.ATTENDED,
      },
    });
  }

  // --- Mentees -------------------------------------------------------------
  const MENTEE_COUNT = 30;
  for (let i = 0; i < MENTEE_COUNT; i++) {
    const isFr = i % 3 === 1;
    const locale = isFr ? Language.FR : Language.EN;
    const first = pick(FIRST_NAMES, i + 15);
    const last = pick(LAST_NAMES, i + 7);
    const email = `mentee.${first}.${last}.${i}@dangote.com`.toLowerCase();
    const user = await ensureUser({ email, name: `${first} ${last}`, locale, passwordHash });
    await grantRole(user.id, roles.MENTEE, cohort.id);

    const sparse = i % 9 === 0; // a few mentees missing career goals, etc.
    const profile = await prisma.menteeProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        cohortId: cohort.id,
        fullName: `${first} ${last}`,
        email,
        phone: `+2347${(20000000 + i).toString().slice(0, 8)}`,
        department: pick(EN_DEPARTMENTS, i + 2),
        jobTitle: 'Officer',
        location: isFr ? pick(FR_LOCATIONS, i) : pick(EN_LOCATIONS, i),
        preferredLanguage: locale,
        currentGrade: pick(['Officer I', 'Officer II', 'Analyst', 'Associate'], i),
        whyMentor: sparse ? null : 'I want guidance to grow into a leadership role.',
        careerGoals: sparse ? null : 'Move into a managerial role within 18 months.',
        personality: pick(['Analytical', 'Driver', 'Amiable', 'Expressive'], i),
        trainingStatus: i % 5 === 0 ? TrainingStatus.IN_PROGRESS : TrainingStatus.COMPLETED,
      },
    });

    // 1 strength + 2 competencies to strengthen.
    const strength = competencyIds[`G:${pick(GENERAL_COMPETENCIES, i)}`]!;
    const toStrengthen1 = competencyIds[`G:${pick(GENERAL_COMPETENCIES, i + 1)}`]!;
    const toStrengthen2 = competencyIds[`T:${pick(TECHNICAL_COMPETENCIES, i)}`]!;
    const links: Array<{ competencyId: string; isStrength: boolean; isToStrengthen: boolean }> = [
      { competencyId: strength, isStrength: true, isToStrengthen: false },
      { competencyId: toStrengthen1, isStrength: false, isToStrengthen: true },
      { competencyId: toStrengthen2, isStrength: false, isToStrengthen: true },
    ];
    for (const link of links) {
      const exists = await prisma.profileCompetency.findFirst({
        where: { menteeProfileId: profile.id, competencyId: link.competencyId },
      });
      if (!exists) {
        await prisma.profileCompetency.create({ data: { menteeProfileId: profile.id, ...link } });
      }
    }
  }

  // --- A messy mentor import for the M1 validator to catch -----------------
  const existingImport = await prisma.import.findFirst({
    where: { cohortId: cohort.id, fileName: 'mentors-batch-2026.csv' },
  });
  if (!existingImport) {
    const messyRows = [
      // missing email
      { 'Full Name': 'Grace Eze', Email: '', Language: 'EN', Department: 'Cement' },
      // invalid email + no language
      { 'Full Name': 'Paul Adeyemi', Email: 'paul(at)dangote.com', Language: '', Department: 'Sugar' },
      // duplicate of a seeded mentor
      { 'Full Name': 'Aisha Eze', Email: 'mentor.aisha.eze.0@dangote.com', Language: 'EN', Department: 'Cement' },
      // 20 years experience but no competency area
      { 'Full Name': 'Sani Bello', Email: 'sani.bello@dangote.com', Language: 'FR', Department: '', Experience: '20 years', Competencies: '' },
      // no name
      { 'Full Name': '', Email: 'unknown@dangote.com', Language: 'EN', Department: 'Logistics' },
    ];
    const imp = await prisma.import.create({
      data: {
        cohortId: cohort.id,
        uploadedById: superAdmin.id,
        fileName: 'mentors-batch-2026.csv',
        sourceType: ImportSourceType.CSV,
        status: ImportStatus.PENDING,
        targetRole: RoleName.MENTOR,
        rowCount: messyRows.length,
      },
      });
    await prisma.importRow.createMany({
      data: messyRows.map((raw, idx) => ({
        importId: imp.id,
        rowNumber: idx + 1,
        raw,
        status: ImportRowStatus.PENDING,
      })),
    });
  }

  // --- A pending invite so the invite flow is demoable ----------------------
  const inviteEmail = 'invited.mentor@dangote.com';
  const existingInvite = await prisma.invite.findFirst({
    where: { email: inviteEmail, status: InviteStatus.PENDING, deletedAt: null },
  });
  if (!existingInvite) {
    const { token, tokenHash } = generateInviteToken();
    await prisma.invite.create({
      data: {
        email: inviteEmail,
        roleName: RoleName.MENTOR,
        cohortId: cohort.id,
        tokenHash,
        expiresAt: inviteExpiry(),
        invitedById: superAdmin.id,
      },
    });
    console.log(`  Demo invite (mentor): /invite/${token}`);
  }

  console.log('Seed complete.');
  console.log(`  Super Admin:    ${SUPER_ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.log('  Programme Admin: prog.admin@dangote.com');
  console.log('  Trainer:         trainer@dangote.com');
  console.log('  Reviewer:        reviewer@dangote.com');
  console.log(`  Mentors: ${MENTOR_COUNT} · Mentees: ${MENTEE_COUNT} (all password: ${DEFAULT_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
