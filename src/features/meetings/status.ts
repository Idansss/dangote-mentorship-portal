import { MeetingStatus, NoShowReason } from '@prisma/client';

// Pure meeting-state logic (experience-layer.md §1.14). No I/O — unit-tested.
// Callers load the meeting and persist the resolved state.

export interface MeetingTiming {
  status: MeetingStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  didHappen: boolean | null;
}

/** The moment a meeting is "over" — its end, or its start if no end is set. */
export function meetingEnd(m: Pick<MeetingTiming, 'startsAt' | 'endsAt'>): Date | null {
  return m.endsAt ?? m.startsAt;
}

/**
 * A scheduled meeting whose time has passed but whose outcome is unrecorded
 * still needs the one-tap "Did this meeting happen?" prompt (§1.14). Once
 * didHappen is set (either way), or the meeting was cancelled in advance, it no
 * longer prompts.
 */
export function needsNoShowCapture(m: MeetingTiming, now: Date = new Date()): boolean {
  if (m.status !== MeetingStatus.SCHEDULED) return false;
  if (m.didHappen !== null) return false;
  const end = meetingEnd(m);
  return end !== null && end.getTime() < now.getTime();
}

/** Upcoming = still scheduled and not yet started (or undated). */
export function isUpcoming(m: MeetingTiming, now: Date = new Date()): boolean {
  if (m.status !== MeetingStatus.SCHEDULED) return false;
  if (m.didHappen !== null) return false;
  const end = meetingEnd(m);
  return end === null || end.getTime() >= now.getTime();
}

export interface NoShowResolution {
  didHappen: boolean;
  status: MeetingStatus;
  noShowReason: NoShowReason | null;
}

/**
 * Resolve a meeting's state from the participant's answer to "Did this meeting
 * happen?". Yes → completed. No → recorded as not having taken place, with the
 * reason kept for the risk monitor and heatmap (the *why*, not just the *that*).
 */
export function resolveNoShowReport(
  happened: boolean,
  reason: NoShowReason | null,
): NoShowResolution {
  if (happened) {
    return { didHappen: true, status: MeetingStatus.COMPLETED, noShowReason: null };
  }
  return { didHappen: false, status: MeetingStatus.CANCELLED, noShowReason: reason };
}

/** A meeting window is valid when it has a start and the end is after it. */
export function isValidWindow(startsAt: Date | null, endsAt: Date | null): boolean {
  if (!startsAt) return false;
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) return false;
  return true;
}
