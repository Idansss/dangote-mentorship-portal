import 'server-only';
import {
  GoalStatus,
  Language,
  MeetingStatus,
  MeetingType,
  RoleName,
  TrainingStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// Read models for the lightweight admin "drill-down" list pages reached from the
// dashboard stat tiles (§12 admin dashboard). Programme-wide, read-only, and
// capped — they answer "show me the records behind this number." Heavier filtering
// and the full reviews/training-batch tooling land with M3.

const LIST_LIMIT = 200;

// ── Goals ───────────────────────────────────────────────────────────────────

export interface AdminGoalRow {
  id: string;
  title: string;
  competency: string | null;
  status: GoalStatus;
  menteeName: string | null;
  menteeProfileId: string | null;
  cohortName: string;
  createdAt: Date;
}

// Every goal that has left DRAFT (i.e. been submitted at least once), newest first.
export async function getProgrammeGoals(): Promise<AdminGoalRow[]> {
  const goals = await prisma.goal.findMany({
    where: { deletedAt: null, status: { not: GoalStatus.DRAFT } },
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
    select: {
      id: true,
      title: true,
      competency: true,
      status: true,
      createdAt: true,
      mentee: { select: { name: true, menteeProfile: { select: { id: true } } } },
      cohort: { select: { name: true } },
    },
  });

  return goals.map((g) => ({
    id: g.id,
    title: g.title,
    competency: g.competency,
    status: g.status,
    menteeName: g.mentee.name,
    menteeProfileId: g.mentee.menteeProfile?.id ?? null,
    cohortName: g.cohort.name,
    createdAt: g.createdAt,
  }));
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export interface AdminMeetingRow {
  id: string;
  title: string;
  type: MeetingType;
  startsAt: Date | null;
  mentorName: string | null;
  mentorProfileId: string | null;
  menteeName: string | null;
  menteeProfileId: string | null;
  cohortName: string;
}

// Scheduled meetings still in the future that haven't been marked happened/no-show.
export async function getUpcomingMeetings(): Promise<AdminMeetingRow[]> {
  const now = new Date();
  const meetings = await prisma.meeting.findMany({
    where: {
      deletedAt: null,
      status: MeetingStatus.SCHEDULED,
      didHappen: null,
      startsAt: { gte: now },
    },
    orderBy: { startsAt: 'asc' },
    take: LIST_LIMIT,
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      mentor: { select: { name: true, mentorProfile: { select: { id: true } } } },
      mentee: { select: { name: true, menteeProfile: { select: { id: true } } } },
      cohort: { select: { name: true } },
    },
  });

  return meetings.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    startsAt: m.startsAt,
    mentorName: m.mentor.name,
    mentorProfileId: m.mentor.mentorProfile?.id ?? null,
    menteeName: m.mentee.name,
    menteeProfileId: m.mentee.menteeProfile?.id ?? null,
    cohortName: m.cohort.name,
  }));
}

// ── Training ──────────────────────────────────────────────────────────────────

export interface AdminTrainingRow {
  id: string;
  name: string;
  role: RoleName;
  language: Language;
  department: string | null;
  status: TrainingStatus;
  cohortName: string;
}

export interface AdminTrainingOverview {
  mentorsTrained: number;
  mentorsTotal: number;
  menteesTrained: number;
  menteesTotal: number;
  rows: AdminTrainingRow[];
}

// Training completion across both profile tables, with the completed ones first so
// the "training completed" number the admin clicked is at the top.
export async function getTrainingOverview(): Promise<AdminTrainingOverview> {
  const [mentors, mentees] = await Promise.all([
    prisma.mentorProfile.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        preferredLanguage: true,
        department: true,
        trainingStatus: true,
        cohort: { select: { name: true } },
      },
    }),
    prisma.menteeProfile.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        preferredLanguage: true,
        department: true,
        trainingStatus: true,
        cohort: { select: { name: true } },
      },
    }),
  ]);

  const rows: AdminTrainingRow[] = [
    ...mentors.map((m) => ({
      id: m.id,
      name: m.fullName,
      role: RoleName.MENTOR,
      language: m.preferredLanguage,
      department: m.department,
      status: m.trainingStatus,
      cohortName: m.cohort.name,
    })),
    ...mentees.map((m) => ({
      id: m.id,
      name: m.fullName,
      role: RoleName.MENTEE,
      language: m.preferredLanguage,
      department: m.department,
      status: m.trainingStatus,
      cohortName: m.cohort.name,
    })),
  ].sort((a, b) => {
    // Completed first, then by name.
    const ac = a.status === TrainingStatus.COMPLETED ? 0 : 1;
    const bc = b.status === TrainingStatus.COMPLETED ? 0 : 1;
    return ac - bc || a.name.localeCompare(b.name);
  });

  const isDone = (s: TrainingStatus) => s === TrainingStatus.COMPLETED;
  return {
    mentorsTrained: mentors.filter((m) => isDone(m.trainingStatus)).length,
    mentorsTotal: mentors.length,
    menteesTrained: mentees.filter((m) => isDone(m.trainingStatus)).length,
    menteesTotal: mentees.length,
    rows,
  };
}
