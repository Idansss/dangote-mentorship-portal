import 'server-only';
import {
  type CompetencyType,
  type GoalStatus,
  type GoalStage,
  type Language,
  type MatchingStatus,
  MatchStatus,
  type TrainingStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// Read models for the admin mentor/mentee DETAIL pages (clickable names → full
// profile + progress). Programme-wide, read-only, admin-gated by the area
// layout (§4). Keyed by profile id (matches the list pages); progress is keyed
// off the profile's userId, which is what matches/goals/sessions/meetings
// reference. Confidentiality (§7/§10): we surface engagement *metadata* (counts,
// statuses, goal titles), never message/note/reflection content.

export interface CompetencyRow {
  name: string;
  type: CompetencyType;
  isStrength: boolean;
  isToStrengthen: boolean;
}

// A paired person on the other side of an accepted match, with the link target
// to their own detail page (null when they have no profile row).
export interface PairedPerson {
  profileId: string | null;
  name: string | null;
}

export interface MentorDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  location: string | null;
  preferredLanguage: Language;
  yearsExperience: number | null;
  currentRole: string | null;
  previousRoles: string | null;
  whyMentor: string | null;
  personality: string | null;
  whatCanLearn: string | null;
  interests: string | null;
  availability: string | null;
  maxMentees: number;
  trainingStatus: TrainingStatus;
  matchingStatus: MatchingStatus;
  cohortName: string;
  competencies: CompetencyRow[];
  mentees: PairedPerson[];
  meetingCount: number;
  sessionCount: number;
}

export interface MenteeGoalRow {
  id: string;
  title: string;
  competency: string | null;
  status: GoalStatus;
  stage: GoalStage;
}

export interface MenteeDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  location: string | null;
  preferredLanguage: Language;
  currentGrade: string | null;
  previousPositions: string | null;
  whyMentor: string | null;
  careerGoals: string | null;
  personality: string | null;
  interests: string | null;
  trainingStatus: TrainingStatus;
  matchingStatus: MatchingStatus;
  cohortName: string;
  competencies: CompetencyRow[];
  mentor: PairedPerson | null;
  goals: MenteeGoalRow[];
  meetingCount: number;
  sessionCount: number;
}

function mapCompetencies(
  rows: {
    isStrength: boolean;
    isToStrengthen: boolean;
    competency: { name: string; type: CompetencyType };
  }[],
): CompetencyRow[] {
  return rows.map((c) => ({
    name: c.competency.name,
    type: c.competency.type,
    isStrength: c.isStrength,
    isToStrengthen: c.isToStrengthen,
  }));
}

export async function getMentorDetail(profileId: string): Promise<MentorDetail | null> {
  const p = await prisma.mentorProfile.findFirst({
    where: { id: profileId, deletedAt: null },
    include: {
      cohort: { select: { name: true } },
      competencies: { include: { competency: { select: { name: true, type: true } } } },
    },
  });
  if (!p) return null;

  const [matches, meetingCount, sessionCount] = await Promise.all([
    prisma.match.findMany({
      where: { mentorId: p.userId, status: MatchStatus.ACCEPTED, deletedAt: null },
      orderBy: { acceptedAt: 'desc' },
      include: {
        mentee: { select: { name: true, menteeProfile: { select: { id: true } } } },
      },
    }),
    prisma.meeting.count({ where: { mentorId: p.userId, deletedAt: null } }),
    prisma.sessionLog.count({ where: { mentorId: p.userId, deletedAt: null } }),
  ]);

  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    department: p.department,
    jobTitle: p.jobTitle,
    location: p.location,
    preferredLanguage: p.preferredLanguage,
    yearsExperience: p.yearsExperience,
    currentRole: p.currentRole,
    previousRoles: p.previousRoles,
    whyMentor: p.whyMentor,
    personality: p.personality,
    whatCanLearn: p.whatCanLearn,
    interests: p.interests,
    availability: p.availability,
    maxMentees: p.maxMentees,
    trainingStatus: p.trainingStatus,
    matchingStatus: p.matchingStatus,
    cohortName: p.cohort.name,
    competencies: mapCompetencies(p.competencies),
    mentees: matches.map((m) => ({
      profileId: m.mentee.menteeProfile?.id ?? null,
      name: m.mentee.name,
    })),
    meetingCount,
    sessionCount,
  };
}

export async function getMenteeDetail(profileId: string): Promise<MenteeDetail | null> {
  const p = await prisma.menteeProfile.findFirst({
    where: { id: profileId, deletedAt: null },
    include: {
      cohort: { select: { name: true } },
      competencies: { include: { competency: { select: { name: true, type: true } } } },
    },
  });
  if (!p) return null;

  const [match, goals, meetingCount, sessionCount] = await Promise.all([
    prisma.match.findFirst({
      where: { menteeId: p.userId, status: MatchStatus.ACCEPTED, deletedAt: null },
      orderBy: { acceptedAt: 'desc' },
      include: {
        mentor: { select: { name: true, mentorProfile: { select: { id: true } } } },
      },
    }),
    prisma.goal.findMany({
      where: { menteeId: p.userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, competency: true, status: true, stage: true },
    }),
    prisma.meeting.count({ where: { menteeId: p.userId, deletedAt: null } }),
    prisma.sessionLog.count({ where: { menteeId: p.userId, deletedAt: null } }),
  ]);

  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    department: p.department,
    jobTitle: p.jobTitle,
    location: p.location,
    preferredLanguage: p.preferredLanguage,
    currentGrade: p.currentGrade,
    previousPositions: p.previousPositions,
    whyMentor: p.whyMentor,
    careerGoals: p.careerGoals,
    personality: p.personality,
    interests: p.interests,
    trainingStatus: p.trainingStatus,
    matchingStatus: p.matchingStatus,
    cohortName: p.cohort.name,
    competencies: mapCompetencies(p.competencies),
    mentor: match
      ? { profileId: match.mentor.mentorProfile?.id ?? null, name: match.mentor.name }
      : null,
    goals,
    meetingCount,
    sessionCount,
  };
}
