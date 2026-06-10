import { describe, expect, it } from 'vitest';
import {
  isMuted,
  isTimeCritical,
  selectEmailChannel,
  NOTIFICATION_TYPES,
} from '@/lib/notifications/types';

// §1.10 batching rule: in-app is always immediate; email is batched into a daily
// digest UNLESS the notification is time-critical, and honours the user's prefs.

describe('isTimeCritical', () => {
  it('marks deadline-bound types as time-critical', () => {
    expect(isTimeCritical('meeting_reminder')).toBe(true);
    expect(isTimeCritical('clinic_tomorrow')).toBe(true);
    expect(isTimeCritical('review_due')).toBe(true);
    expect(isTimeCritical('session_log_due')).toBe(true);
  });

  it('treats informational types as not time-critical', () => {
    expect(isTimeCritical('goal_commented')).toBe(false);
    expect(isTimeCritical('match_ready')).toBe(false);
    expect(isTimeCritical('support_received')).toBe(false);
  });
});

describe('selectEmailChannel', () => {
  const on = { emailEnabled: true, digestEnabled: true };

  it('sends time-critical types immediately', () => {
    expect(selectEmailChannel('meeting_reminder', on)).toBe('immediate');
  });

  it('batches non-urgent types into the digest', () => {
    expect(selectEmailChannel('goal_commented', on)).toBe('digest');
  });

  it('routes non-urgent types nowhere when the digest is off', () => {
    expect(selectEmailChannel('goal_commented', { emailEnabled: true, digestEnabled: false })).toBe('none');
  });

  it('still sends time-critical types even with the digest off', () => {
    expect(selectEmailChannel('review_due', { emailEnabled: true, digestEnabled: false })).toBe('immediate');
  });

  it('sends nothing to email when email is disabled, even for urgent types', () => {
    expect(selectEmailChannel('meeting_reminder', { emailEnabled: false, digestEnabled: true })).toBe('none');
  });
});

describe('isMuted', () => {
  it('detects a muted type', () => {
    expect(isMuted('goal_commented', ['goal_commented', 'match_ready'])).toBe(true);
    expect(isMuted('support_received', ['goal_commented'])).toBe(false);
  });
});

describe('NOTIFICATION_TYPES', () => {
  it('has no duplicates', () => {
    expect(new Set(NOTIFICATION_TYPES).size).toBe(NOTIFICATION_TYPES.length);
  });
});
