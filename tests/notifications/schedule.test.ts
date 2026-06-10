import { describe, it, expect } from 'vitest';
import { MeetingStatus } from '@prisma/client';
import {
  needsMeetingReminder,
  needsSessionLogReminder,
  isMentorProfileIncomplete,
  isMenteeProfileIncomplete,
} from '@/lib/notifications/schedule';

const NOW = new Date('2026-06-10T12:00:00.000Z');
const inHours = (h: number) => new Date(NOW.getTime() + h * 3600_000);

describe('needsMeetingReminder', () => {
  it('reminds for a scheduled meeting inside the 24h window', () => {
    expect(
      needsMeetingReminder(
        { status: MeetingStatus.SCHEDULED, startsAt: inHours(3), didHappen: null },
        NOW,
      ),
    ).toBe(true);
  });

  it('does not remind for a meeting beyond the window', () => {
    expect(
      needsMeetingReminder(
        { status: MeetingStatus.SCHEDULED, startsAt: inHours(48), didHappen: null },
        NOW,
      ),
    ).toBe(false);
  });

  it('does not remind for a meeting that already started', () => {
    expect(
      needsMeetingReminder(
        { status: MeetingStatus.SCHEDULED, startsAt: inHours(-1), didHappen: null },
        NOW,
      ),
    ).toBe(false);
  });

  it('does not remind for cancelled, resolved, or undated meetings', () => {
    expect(
      needsMeetingReminder(
        { status: MeetingStatus.CANCELLED, startsAt: inHours(3), didHappen: null },
        NOW,
      ),
    ).toBe(false);
    expect(
      needsMeetingReminder(
        { status: MeetingStatus.SCHEDULED, startsAt: inHours(3), didHappen: true },
        NOW,
      ),
    ).toBe(false);
    expect(
      needsMeetingReminder(
        { status: MeetingStatus.SCHEDULED, startsAt: null, didHappen: null },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('needsSessionLogReminder', () => {
  const base = {
    status: MeetingStatus.SCHEDULED,
    startsAt: inHours(-5),
    endsAt: inHours(-4),
    didHappen: null as boolean | null,
    hasSessionLog: false,
  };

  it('nudges for a past meeting (beyond grace) with no log', () => {
    expect(needsSessionLogReminder(base, NOW)).toBe(true);
  });

  it('does not nudge inside the grace window', () => {
    expect(
      needsSessionLogReminder({ ...base, startsAt: inHours(-1), endsAt: inHours(-1) }, NOW),
    ).toBe(false);
  });

  it('does not nudge when a log already exists', () => {
    expect(needsSessionLogReminder({ ...base, hasSessionLog: true }, NOW)).toBe(false);
  });

  it('does not nudge for a confirmed no-show or a cancelled meeting', () => {
    expect(needsSessionLogReminder({ ...base, didHappen: false }, NOW)).toBe(false);
    expect(needsSessionLogReminder({ ...base, status: MeetingStatus.CANCELLED }, NOW)).toBe(false);
  });

  it('still nudges for a completed (didHappen=true) meeting with no log', () => {
    expect(
      needsSessionLogReminder({ ...base, status: MeetingStatus.COMPLETED, didHappen: true }, NOW),
    ).toBe(true);
  });

  it('falls back to startsAt when endsAt is missing', () => {
    expect(needsSessionLogReminder({ ...base, endsAt: null }, NOW)).toBe(true);
  });
});

describe('profile completeness', () => {
  const fullMentor = {
    department: 'Cement',
    jobTitle: 'GM',
    yearsExperience: 12,
    whyMentor: 'Give back',
    availability: 'Weekly',
  };
  const fullMentee = {
    department: 'Cement',
    jobTitle: 'Analyst',
    careerGoals: 'Lead a team',
    whyMentor: 'Grow',
  };

  it('treats a fully filled mentor profile as complete', () => {
    expect(isMentorProfileIncomplete(fullMentor)).toBe(false);
  });

  it('flags a mentor missing experience (incl. zero-vs-null)', () => {
    expect(isMentorProfileIncomplete({ ...fullMentor, yearsExperience: null })).toBe(true);
    // 0 years is a real value, not missing.
    expect(isMentorProfileIncomplete({ ...fullMentor, yearsExperience: 0 })).toBe(false);
  });

  it('flags a mentor missing any text field', () => {
    expect(isMentorProfileIncomplete({ ...fullMentor, availability: '' })).toBe(true);
    expect(isMentorProfileIncomplete({ ...fullMentor, whyMentor: null })).toBe(true);
  });

  it('treats a fully filled mentee profile as complete and flags gaps', () => {
    expect(isMenteeProfileIncomplete(fullMentee)).toBe(false);
    expect(isMenteeProfileIncomplete({ ...fullMentee, careerGoals: null })).toBe(true);
    expect(isMenteeProfileIncomplete({ ...fullMentee, department: '' })).toBe(true);
  });
});
