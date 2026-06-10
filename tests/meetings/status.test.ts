import { describe, expect, it } from 'vitest';
import { MeetingStatus, NoShowReason } from '@prisma/client';
import {
  isUpcoming,
  isValidWindow,
  needsNoShowCapture,
  resolveNoShowReport,
} from '@/features/meetings/status';

const past = new Date('2026-01-01T10:00:00Z');
const future = new Date('2027-01-01T10:00:00Z');
const now = new Date('2026-06-10T12:00:00Z');

describe('needsNoShowCapture', () => {
  it('prompts for a passed scheduled meeting with no recorded outcome', () => {
    expect(
      needsNoShowCapture({ status: MeetingStatus.SCHEDULED, startsAt: past, endsAt: past, didHappen: null }, now),
    ).toBe(true);
  });

  it('does not prompt for a future meeting', () => {
    expect(
      needsNoShowCapture({ status: MeetingStatus.SCHEDULED, startsAt: future, endsAt: future, didHappen: null }, now),
    ).toBe(false);
  });

  it('does not prompt once the outcome is recorded', () => {
    expect(
      needsNoShowCapture({ status: MeetingStatus.SCHEDULED, startsAt: past, endsAt: past, didHappen: true }, now),
    ).toBe(false);
    expect(
      needsNoShowCapture({ status: MeetingStatus.SCHEDULED, startsAt: past, endsAt: past, didHappen: false }, now),
    ).toBe(false);
  });

  it('does not prompt for cancelled/completed meetings', () => {
    expect(
      needsNoShowCapture({ status: MeetingStatus.CANCELLED, startsAt: past, endsAt: past, didHappen: null }, now),
    ).toBe(false);
  });
});

describe('isUpcoming', () => {
  it('is true for a future scheduled meeting and false for a past one', () => {
    expect(isUpcoming({ status: MeetingStatus.SCHEDULED, startsAt: future, endsAt: future, didHappen: null }, now)).toBe(true);
    expect(isUpcoming({ status: MeetingStatus.SCHEDULED, startsAt: past, endsAt: past, didHappen: null }, now)).toBe(false);
  });
});

describe('resolveNoShowReport', () => {
  it('marks a happened meeting completed with no reason', () => {
    expect(resolveNoShowReport(true, null)).toEqual({
      didHappen: true,
      status: MeetingStatus.COMPLETED,
      noShowReason: null,
    });
  });

  it('records a no-show with its reason', () => {
    expect(resolveNoShowReport(false, NoShowReason.MENTEE_CANCELLED)).toEqual({
      didHappen: false,
      status: MeetingStatus.CANCELLED,
      noShowReason: NoShowReason.MENTEE_CANCELLED,
    });
  });
});

describe('isValidWindow', () => {
  it('requires a start and an end strictly after it', () => {
    const start = new Date('2026-06-10T10:00:00Z');
    const end = new Date('2026-06-10T11:00:00Z');
    expect(isValidWindow(start, end)).toBe(true);
    expect(isValidWindow(start, start)).toBe(false);
    expect(isValidWindow(null, end)).toBe(false);
    expect(isValidWindow(start, null)).toBe(true);
  });
});
