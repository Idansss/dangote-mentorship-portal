import 'server-only';
import { CohortStatus, MeetingStatus, RoleName } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { SessionUser } from '@/lib/auth/rbac';
import type { CalendarEvent } from './calendar';

// Read model for the calendar (experience-layer.md §1.12). Returns the events a
// user should see in a date range: their own meetings plus programme milestones
// (cohort start/end). Clinics (M4), review deadlines (M3), and training sessions
// join here as those features land — the event type is already open for them.

interface MilestoneLabels {
  start: string;
  end: string;
}

/** Cohort ids relevant to the user: their profile cohort + matched cohorts, or
 *  all active cohorts for admins (so the programme calendar is visible). */
async function relevantCohortIds(user: SessionUser): Promise<string[]> {
  const isAdmin =
    user.roles.includes(RoleName.SUPER_ADMIN) || user.roles.includes(RoleName.PROGRAMME_ADMIN);
  if (isAdmin) {
    const cohorts = await prisma.cohort.findMany({
      where: { deletedAt: null, status: CohortStatus.ACTIVE },
      select: { id: true },
    });
    return cohorts.map((c) => c.id);
  }

  const [mentor, mentee] = await Promise.all([
    prisma.mentorProfile.findFirst({ where: { userId: user.id, deletedAt: null }, select: { cohortId: true } }),
    prisma.menteeProfile.findFirst({ where: { userId: user.id, deletedAt: null }, select: { cohortId: true } }),
  ]);
  const ids = new Set<string>();
  if (mentor) ids.add(mentor.cohortId);
  if (mentee) ids.add(mentee.cohortId);
  return [...ids];
}

export async function getCalendarEvents(
  user: SessionUser,
  start: Date,
  end: Date,
  labels: MilestoneLabels,
): Promise<CalendarEvent[]> {
  // End-of-day for an inclusive range on the closing date.
  const endInclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);

  const cohortIds = await relevantCohortIds(user);

  const [meetings, cohorts] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        deletedAt: null,
        startsAt: { gte: start, lte: endInclusive },
        OR: [{ mentorId: user.id }, { menteeId: user.id }],
      },
      orderBy: { startsAt: 'asc' },
      select: { id: true, title: true, startsAt: true, endsAt: true, status: true },
    }),
    cohortIds.length
      ? prisma.cohort.findMany({
          where: { id: { in: cohortIds }, deletedAt: null },
          select: { id: true, name: true, startDate: true, endDate: true },
        })
      : Promise.resolve([]),
  ]);

  const events: CalendarEvent[] = [];

  for (const m of meetings) {
    if (!m.startsAt) continue;
    events.push({
      id: `meeting:${m.id}`,
      title: m.title,
      start: m.startsAt,
      end: m.endsAt,
      type: 'meeting',
      link: m.status === MeetingStatus.SCHEDULED ? `/meetings/${m.id}/prepare` : '/meetings',
    });
  }

  const inRange = (d: Date | null): d is Date =>
    d !== null && d.getTime() >= start.getTime() && d.getTime() <= endInclusive.getTime();

  for (const c of cohorts) {
    if (inRange(c.startDate)) {
      events.push({
        id: `cohort-start:${c.id}`,
        title: `${labels.start} · ${c.name}`,
        start: c.startDate,
        end: null,
        type: 'milestone',
        link: null,
      });
    }
    if (inRange(c.endDate)) {
      events.push({
        id: `cohort-end:${c.id}`,
        title: `${labels.end} · ${c.name}`,
        start: c.endDate,
        end: null,
        type: 'milestone',
        link: null,
      });
    }
  }

  return events;
}
