import { describe, expect, it } from 'vitest';
import {
  evaluatePairRisk,
  worstSeverity,
  DEFAULT_RISK_THRESHOLDS,
  type PairRiskFacts,
} from '@/features/risk/rules';

// The Risk & Engagement Monitor is rule-based and deterministic, so it gets full
// unit coverage (CLAUDE.md §9.8). These tests also pin the confidentiality
// contract: the rules only ever consume metadata (counts/dates), never content.

// A healthy, recently-matched pair that should raise no flags.
function healthy(overrides: Partial<PairRiskFacts> = {}): PairRiskFacts {
  return {
    daysSinceMatch: 5,
    sessionCount: 2,
    daysSinceLastSession: 3,
    goalsSubmitted: 2,
    goalsAwaitingApproval: 0,
    midtermPublished: false,
    midtermComplete: false,
    finalPublished: false,
    finalComplete: false,
    ...overrides,
  };
}

describe('evaluatePairRisk — sessions', () => {
  it('does not flag a brand-new pair with no sessions (within grace)', () => {
    expect(evaluatePairRisk(healthy({ sessionCount: 0, daysSinceLastSession: null, daysSinceMatch: 5 }))).toHaveLength(0);
  });

  it('flags no_sessions as risk once past the grace window', () => {
    const flags = evaluatePairRisk(healthy({ sessionCount: 0, daysSinceLastSession: null, daysSinceMatch: 40 }));
    expect(flags).toEqual([{ code: 'no_sessions', severity: 'risk', params: { days: 40 } }]);
  });

  it('flags stale_sessions as warn for an active pair gone quiet', () => {
    const flags = evaluatePairRisk(healthy({ sessionCount: 3, daysSinceLastSession: 45 }));
    expect(flags).toEqual([{ code: 'stale_sessions', severity: 'warn', params: { days: 45 } }]);
  });
});

describe('evaluatePairRisk — goals', () => {
  it('flags no_goals as risk past the goal grace window', () => {
    const flags = evaluatePairRisk(healthy({ goalsSubmitted: 0, daysSinceMatch: 30 }));
    expect(flags.some((f) => f.code === 'no_goals' && f.severity === 'risk')).toBe(true);
  });

  it('does not flag missing goals before the grace window', () => {
    const flags = evaluatePairRisk(healthy({ goalsSubmitted: 0, daysSinceMatch: 5 }));
    expect(flags.some((f) => f.code === 'no_goals')).toBe(false);
  });

  it('flags goals awaiting approval as warn', () => {
    const flags = evaluatePairRisk(healthy({ goalsSubmitted: 2, goalsAwaitingApproval: 1 }));
    expect(flags).toContainEqual({ code: 'goals_awaiting_approval', severity: 'warn', params: { count: 1 } });
  });
});

describe('evaluatePairRisk — reviews', () => {
  it('only flags an incomplete review when its form is published', () => {
    expect(evaluatePairRisk(healthy({ midtermPublished: false, midtermComplete: false }))).toHaveLength(0);
    const flags = evaluatePairRisk(healthy({ midtermPublished: true, midtermComplete: false }));
    expect(flags).toContainEqual({ code: 'midterm_incomplete', severity: 'warn' });
  });

  it('does not flag a published review that is complete', () => {
    const flags = evaluatePairRisk(healthy({ finalPublished: true, finalComplete: true }));
    expect(flags.some((f) => f.code === 'final_incomplete')).toBe(false);
  });
});

describe('evaluatePairRisk — ordering & severity', () => {
  it('orders risk flags before warn flags', () => {
    const flags = evaluatePairRisk(
      healthy({ sessionCount: 0, daysSinceLastSession: null, daysSinceMatch: 40, midtermPublished: true }),
    );
    expect(flags[0]?.severity).toBe('risk');
    expect(flags.at(-1)?.severity).toBe('warn');
  });

  it('respects custom thresholds', () => {
    const flags = evaluatePairRisk(
      healthy({ sessionCount: 0, daysSinceLastSession: null, daysSinceMatch: 10 }),
      { ...DEFAULT_RISK_THRESHOLDS, noSessionGraceDays: 7 },
    );
    expect(flags.some((f) => f.code === 'no_sessions')).toBe(true);
  });
});

describe('worstSeverity', () => {
  it('returns the highest severity present, or null', () => {
    expect(worstSeverity([])).toBeNull();
    expect(worstSeverity([{ code: 'midterm_incomplete', severity: 'warn' }])).toBe('warn');
    expect(
      worstSeverity([
        { code: 'midterm_incomplete', severity: 'warn' },
        { code: 'no_goals', severity: 'risk' },
      ]),
    ).toBe('risk');
  });
});
