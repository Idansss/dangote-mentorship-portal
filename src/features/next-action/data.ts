import 'server-only';
import { getTranslations } from 'next-intl/server';
import {
  ActionItemStatus,
  GoalStatus,
  MatchStatus,
  MeetingStatus,
  RoleName,
  SupportRequestStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getMenteePairing, getMentorPairings } from '@/lib/pairings';
import type { SessionUser } from '@/lib/auth/rbac';
import type { NextActionCandidate } from './next-action';

// Assembles the live, deep-linked candidates behind "What should I do next?"
// (experience-layer.md §1.3). Everything here is a real record the user can act
// on — counts come from the DB, never from the model. Messages are localized in
// the recipient's UI language so the AI receives readable, grounded facts.

const ACTIVE_ITEM_STATUSES: ActionItemStatus[] = [
  ActionItemStatus.OPEN,
  ActionItemStatus.IN_PROGRESS,
  ActionItemStatus.BLOCKED,
];

export interface NextActionContext {
  candidates: NextActionCandidate[];
  cohortId: string | null;
}

/** Build the candidate set for whatever roles the user holds. */
export async function getNextActionContext(user: SessionUser): Promise<NextActionContext> {
  const t = await getTranslations('nextAction');
  const now = new Date();
  const candidates: NextActionCandidate[] = [];
  let cohortId: string | null = null;

  const isMentee = user.roles.includes(RoleName.MENTEE);
  const isMentor = user.roles.includes(RoleName.MENTOR);
  const isAdmin = user.roles.includes(RoleName.SUPER_ADMIN);

  // Overdue action items assigned to this user (applies to mentor and mentee).
  if (isMentee || isMentor) {
    const overdue = await prisma.actionItem.count({
      where: {
        assigneeId: user.id,
        deletedAt: null,
        status: { in: ACTIVE_ITEM_STATUSES },
        dueDate: { lt: now },
      },
    });
    if (overdue > 0) {
      candidates.push({
        key: 'overdue_actions',
        priority: 90,
        message: t('overdueActions', { count: overdue }),
        link: '/sessions',
      });
    }

    // Meetings whose time has passed but outcome is unrecorded — one tap confirms.
    const toConfirm = await prisma.meeting.count({
      where: {
        deletedAt: null,
        status: MeetingStatus.SCHEDULED,
        didHappen: null,
        startsAt: { lt: now },
        OR: [{ mentorId: user.id }, { menteeId: user.id }],
      },
    });
    if (toConfirm > 0) {
      candidates.push({
        key: 'confirm_meeting',
        priority: 78,
        message: t('confirmMeeting', { count: toConfirm }),
        link: '/meetings',
      });
    }

    const hasUpcoming = await prisma.meeting.count({
      where: {
        deletedAt: null,
        status: MeetingStatus.SCHEDULED,
        didHappen: null,
        startsAt: { gte: now },
        OR: [{ mentorId: user.id }, { menteeId: user.id }],
      },
    });
    if (hasUpcoming === 0) {
      candidates.push({
        key: 'schedule_meeting',
        priority: 40,
        message: t('scheduleMeeting'),
        link: '/meetings',
      });
    }
  }

  if (isMentee) {
    const pairing = await getMenteePairing(user.id);
    if (pairing) cohortId = pairing.cohortId;

    const changesRequested = await prisma.goal.count({
      where: { menteeId: user.id, deletedAt: null, status: GoalStatus.REJECTED },
    });
    if (changesRequested > 0) {
      candidates.push({
        key: 'goal_changes',
        priority: 82,
        message: t('goalChanges', { count: changesRequested }),
        link: '/goals',
      });
    }

    // No goals on record yet → set one (only meaningful once matched).
    if (pairing) {
      const anyGoal = await prisma.goal.count({ where: { menteeId: user.id, deletedAt: null } });
      if (anyGoal === 0) {
        candidates.push({ key: 'set_goal', priority: 60, message: t('setGoal'), link: '/goals' });
      }
    }
  }

  if (isMentor) {
    const pairings = await getMentorPairings(user.id);
    if (pairings.length > 0) cohortId = cohortId ?? pairings[0]?.cohortId ?? null;
    const menteeIds = pairings.map((p) => p.menteeId);

    if (menteeIds.length > 0) {
      const pendingReviews = await prisma.goal.count({
        where: { menteeId: { in: menteeIds }, deletedAt: null, status: GoalStatus.SUBMITTED },
      });
      if (pendingReviews > 0) {
        candidates.push({
          key: 'goal_reviews',
          priority: 85,
          message: t('goalReviews', { count: pendingReviews }),
          link: '/goals',
        });
      }
    }
  }

  if (isAdmin) {
    const [openSupport, pendingMatches] = await Promise.all([
      prisma.supportRequest.count({ where: { deletedAt: null, status: SupportRequestStatus.OPEN } }),
      prisma.match.count({
        where: {
          deletedAt: null,
          status: { in: [MatchStatus.SUGGESTED, MatchStatus.ADMIN_APPROVED] },
        },
      }),
    ]);
    if (openSupport > 0) {
      candidates.push({
        key: 'open_support',
        priority: 80,
        message: t('openSupport', { count: openSupport }),
        link: '/admin/support',
      });
    }
    if (pendingMatches > 0) {
      candidates.push({
        key: 'pending_matches',
        priority: 60,
        message: t('pendingMatches', { count: pendingMatches }),
        link: '/admin/matching',
      });
    }
  }

  return { candidates, cohortId };
}
