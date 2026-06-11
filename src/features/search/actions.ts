'use server';

import { z } from 'zod';
import { GoalStatus, MeetingStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { rateLimit } from '@/lib/auth/rate-limit';
import { ok, fail, mapActionError, type ActionResult } from '@/lib/actions/result';

// Global search (CLAUDE.md §13 search). Server-side and RBAC-scoped: the
// people/goals/meetings/cohorts directory is admin-only (confidentiality, §7),
// so non-admins get no record hits here — their "search anything" is the
// client-side page/nav match. Page matching lives in the client component; this
// action returns DB records only.

export type SearchKind = 'mentor' | 'mentee' | 'goal' | 'meeting' | 'cohort';

export interface SearchHit {
  kind: SearchKind;
  label: string;
  sublabel: string | null;
  href: string;
}

const PER_KIND = 5;
const querySchema = z.object({ query: z.string().trim().min(2).max(100) });

export async function searchPortal(input: {
  query: string;
}): Promise<ActionResult<{ hits: SearchHit[] }>> {
  try {
    const user = await requireUser();

    const parsed = querySchema.safeParse(input);
    if (!parsed.success) return ok({ hits: [] }); // too short / empty → nothing
    const q = parsed.data.query;

    // Light per-user throttle (§14) — search fires on keystroke (debounced).
    if (!rateLimit(`search:${user.id}`, 60, 60_000).ok) {
      return fail({ code: 'CONFLICT', message: 'Too many searches. Please slow down.' });
    }

    // Record search is admin-only; participants rely on page/nav matching.
    if (!hasAnyRole(user, ADMIN_ROLES)) return ok({ hits: [] });

    const contains = { contains: q, mode: 'insensitive' as const };

    const [mentors, mentees, goals, meetings, cohorts] = await Promise.all([
      prisma.mentorProfile.findMany({
        where: { deletedAt: null, fullName: contains },
        select: { id: true, fullName: true, department: true },
        take: PER_KIND,
        orderBy: { fullName: 'asc' },
      }),
      prisma.menteeProfile.findMany({
        where: { deletedAt: null, fullName: contains },
        select: { id: true, fullName: true, department: true },
        take: PER_KIND,
        orderBy: { fullName: 'asc' },
      }),
      prisma.goal.findMany({
        where: { deletedAt: null, status: { not: GoalStatus.DRAFT }, title: contains },
        select: { id: true, title: true, mentee: { select: { name: true } } },
        take: PER_KIND,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.meeting.findMany({
        where: { deletedAt: null, status: MeetingStatus.SCHEDULED, title: contains },
        select: { id: true, title: true, startsAt: true },
        take: PER_KIND,
        orderBy: { startsAt: 'asc' },
      }),
      prisma.cohort.findMany({
        where: { deletedAt: null, name: contains },
        select: { id: true, name: true },
        take: PER_KIND,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const hits: SearchHit[] = [
      ...mentors.map((m) => ({
        kind: 'mentor' as const,
        label: m.fullName,
        sublabel: m.department,
        href: `/admin/mentors/${m.id}`,
      })),
      ...mentees.map((m) => ({
        kind: 'mentee' as const,
        label: m.fullName,
        sublabel: m.department,
        href: `/admin/mentees/${m.id}`,
      })),
      ...goals.map((g) => ({
        kind: 'goal' as const,
        label: g.title,
        sublabel: g.mentee.name,
        href: `/admin/goals`,
      })),
      ...meetings.map((m) => ({
        kind: 'meeting' as const,
        label: m.title,
        sublabel: m.startsAt ? m.startsAt.toISOString().slice(0, 10) : null,
        href: `/admin/meetings`,
      })),
      ...cohorts.map((c) => ({
        kind: 'cohort' as const,
        label: c.name,
        sublabel: null,
        href: `/admin/cohorts/${c.id}/edit`,
      })),
    ];

    return ok({ hits });
  } catch (error) {
    return mapActionError(error);
  }
}
