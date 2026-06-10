// Pure calendar maths for the month/week/list views (experience-layer.md §1.12).
// No I/O, no timezone library: all dates are handled in UTC (the app stores UTC
// and the views are date-grained), and the grid/navigation logic is unit-tested.
// The Outlook write-path already lands elsewhere; this is the read surface.

export type CalendarView = 'month' | 'week' | 'list';

export const CALENDAR_VIEWS: CalendarView[] = ['month', 'week', 'list'];

export function isCalendarView(v: string | null | undefined): v is CalendarView {
  return v === 'month' || v === 'week' || v === 'list';
}

/** YYYY-MM-DD in UTC. */
export function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD anchor to a UTC midnight Date; today when absent/invalid. */
export function parseAnchor(value: string | null | undefined, today: Date = new Date()): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(`${ymd(today)}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** Monday-based start of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  return addDays(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())), -diff);
}

/** The seven Mon–Sun days of the week containing `date`. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Weeks (Mon–Sun) covering the whole month of `date`, padded with leading/trailing
 * days so every row is a full week. Used to render the month grid.
 */
export function monthGrid(date: Date): Date[][] {
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first);
  const last = endOfMonth(date);
  const weeks: Date[][] = [];
  let cursor = gridStart;
  // Always render full weeks until we've passed the last day of the month.
  while (cursor <= last || weeks.length === 0 || cursor.getUTCDay() !== 1) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
    weeks.push(week);
    cursor = addDays(cursor, 7);
    if (weeks.length > 6) break; // safety: a month spans at most 6 weeks
  }
  return weeks;
}

/** The inclusive date range a view needs to query for events. */
export function rangeForView(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  if (view === 'week') {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 6) };
  }
  if (view === 'list') {
    // List shows the next ~60 days from the anchor.
    return { start: anchor, end: addDays(anchor, 60) };
  }
  const grid = monthGrid(anchor);
  return { start: grid[0]![0]!, end: grid[grid.length - 1]![6]! };
}

/** Step the anchor by one unit of the given view (sign = direction). */
export function step(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  if (view === 'month') return addMonths(anchor, direction);
  if (view === 'week') return addDays(anchor, 7 * direction);
  return addDays(anchor, 30 * direction);
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date | null;
  type: 'meeting' | 'milestone';
  link: string | null;
}

/** Group events by their UTC day (YYYY-MM-DD), each day's events sorted by start. */
export function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = ymd(e.start);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  return map;
}
