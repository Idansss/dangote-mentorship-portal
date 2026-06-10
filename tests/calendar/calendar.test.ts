import { describe, expect, it } from 'vitest';
import {
  addMonths,
  groupByDay,
  isCalendarView,
  monthGrid,
  parseAnchor,
  rangeForView,
  startOfWeek,
  step,
  weekDays,
  ymd,
  type CalendarEvent,
} from '@/features/calendar/calendar';

describe('isCalendarView', () => {
  it('accepts the three views and rejects others', () => {
    expect(isCalendarView('month')).toBe(true);
    expect(isCalendarView('week')).toBe(true);
    expect(isCalendarView('list')).toBe(true);
    expect(isCalendarView('day')).toBe(false);
    expect(isCalendarView(null)).toBe(false);
  });
});

describe('parseAnchor', () => {
  it('parses a valid YYYY-MM-DD as UTC midnight', () => {
    expect(ymd(parseAnchor('2026-06-10'))).toBe('2026-06-10');
  });
  it('falls back to today for invalid/absent input', () => {
    const today = new Date('2026-06-10T15:00:00Z');
    expect(ymd(parseAnchor('nope', today))).toBe('2026-06-10');
    expect(ymd(parseAnchor(null, today))).toBe('2026-06-10');
  });
});

describe('startOfWeek', () => {
  it('returns the Monday of the week (Wed 2026-06-10 → Mon 2026-06-08)', () => {
    expect(ymd(startOfWeek(parseAnchor('2026-06-10')))).toBe('2026-06-08');
  });
  it('keeps Monday as the start', () => {
    expect(ymd(startOfWeek(parseAnchor('2026-06-08')))).toBe('2026-06-08');
  });
  it('treats Sunday as the end of the prior week', () => {
    expect(ymd(startOfWeek(parseAnchor('2026-06-14')))).toBe('2026-06-08');
  });
});

describe('weekDays', () => {
  it('returns 7 Mon–Sun days', () => {
    const days = weekDays(parseAnchor('2026-06-10')).map(ymd);
    expect(days).toEqual([
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
      '2026-06-13',
      '2026-06-14',
    ]);
  });
});

describe('monthGrid', () => {
  it('covers June 2026 in full Mon–Sun weeks starting before the 1st', () => {
    const grid = monthGrid(parseAnchor('2026-06-10'));
    // June 1 2026 is a Monday, so the grid starts on June 1.
    expect(ymd(grid[0]![0]!)).toBe('2026-06-01');
    expect(grid.every((w) => w.length === 7)).toBe(true);
    // Last day June 30 (Tue) must be present.
    const flat = grid.flat().map(ymd);
    expect(flat).toContain('2026-06-30');
  });
});

describe('rangeForView', () => {
  it('week range spans the Mon–Sun of the anchor', () => {
    const { start, end } = rangeForView('week', parseAnchor('2026-06-10'));
    expect(ymd(start)).toBe('2026-06-08');
    expect(ymd(end)).toBe('2026-06-14');
  });
  it('list range is the next ~60 days', () => {
    const { start, end } = rangeForView('list', parseAnchor('2026-06-10'));
    expect(ymd(start)).toBe('2026-06-10');
    expect(ymd(end)).toBe('2026-08-09');
  });
});

describe('step', () => {
  it('moves a month for month view', () => {
    expect(ymd(step('month', parseAnchor('2026-06-10'), 1))).toBe(ymd(addMonths(parseAnchor('2026-06-10'), 1)));
  });
  it('moves seven days for week view', () => {
    expect(ymd(step('week', parseAnchor('2026-06-10'), -1))).toBe('2026-06-03');
  });
});

describe('groupByDay', () => {
  it('buckets events by UTC day and sorts within a day', () => {
    const events: CalendarEvent[] = [
      { id: 'b', title: 'B', start: new Date('2026-06-10T14:00:00Z'), end: null, type: 'meeting', link: null },
      { id: 'a', title: 'A', start: new Date('2026-06-10T09:00:00Z'), end: null, type: 'meeting', link: null },
      { id: 'c', title: 'C', start: new Date('2026-06-11T09:00:00Z'), end: null, type: 'milestone', link: null },
    ];
    const grouped = groupByDay(events);
    expect(grouped.get('2026-06-10')!.map((e) => e.id)).toEqual(['a', 'b']);
    expect(grouped.get('2026-06-11')!.map((e) => e.id)).toEqual(['c']);
  });
});
