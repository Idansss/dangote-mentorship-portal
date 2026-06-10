// Pure Risk & Engagement Monitor logic (CLAUDE.md §9.8, §16). Rule-based and
// deterministic — fully unit-tested. CRITICAL: this operates on engagement
// METADATA ONLY (counts, dates, statuses). It never sees message, reflection, or
// note content — that confidentiality posture is non-negotiable (CLAUDE.md §7,
// §10). The monitor flags; a human acts.

export type RiskSeverity = 'warn' | 'risk';

export type RiskCode =
  | 'no_sessions'
  | 'stale_sessions'
  | 'no_goals'
  | 'goals_awaiting_approval'
  | 'midterm_incomplete'
  | 'final_incomplete';

export interface RiskFlag {
  code: RiskCode;
  severity: RiskSeverity;
  /** Numeric params for the i18n message (e.g. day counts). */
  params?: Record<string, number>;
}

// Per-pair engagement metadata — the only inputs the monitor ever receives.
export interface PairRiskFacts {
  daysSinceMatch: number;
  sessionCount: number;
  /** Days since the most recent session log, or null if none was ever logged. */
  daysSinceLastSession: number | null;
  /** Goals the mentee has put forward (any submitted/approved/etc). */
  goalsSubmitted: number;
  /** Goals still in SUBMITTED status awaiting the mentor's approval. */
  goalsAwaitingApproval: number;
  midtermPublished: boolean;
  midtermComplete: boolean;
  finalPublished: boolean;
  finalComplete: boolean;
}

export interface RiskThresholds {
  /** A matched pair with no session by this many days is at risk. */
  noSessionGraceDays: number;
  /** Days without a session before an active pair is flagged stale. */
  staleSessionDays: number;
  /** Days after matching by which a mentee should have submitted goals. */
  goalGraceDays: number;
}

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  noSessionGraceDays: 30,
  staleSessionDays: 30,
  goalGraceDays: 21,
};

/**
 * Evaluate one matched pair against the rules, returning zero or more flags
 * ordered most-severe first. Pure: callers pass already-derived metadata.
 */
export function evaluatePairRisk(
  facts: PairRiskFacts,
  thresholds: RiskThresholds = DEFAULT_RISK_THRESHOLDS,
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Sessions ----------------------------------------------------------------
  if (facts.sessionCount === 0) {
    // Only a concern once the pair has had time to meet.
    if (facts.daysSinceMatch >= thresholds.noSessionGraceDays) {
      flags.push({ code: 'no_sessions', severity: 'risk', params: { days: facts.daysSinceMatch } });
    }
  } else if (
    facts.daysSinceLastSession !== null &&
    facts.daysSinceLastSession >= thresholds.staleSessionDays
  ) {
    flags.push({
      code: 'stale_sessions',
      severity: 'warn',
      params: { days: facts.daysSinceLastSession },
    });
  }

  // Goals -------------------------------------------------------------------
  if (facts.goalsSubmitted === 0) {
    if (facts.daysSinceMatch >= thresholds.goalGraceDays) {
      flags.push({ code: 'no_goals', severity: 'risk', params: { days: facts.daysSinceMatch } });
    }
  } else if (facts.goalsAwaitingApproval > 0) {
    flags.push({
      code: 'goals_awaiting_approval',
      severity: 'warn',
      params: { count: facts.goalsAwaitingApproval },
    });
  }

  // Reviews — only flag once a form is published for the cohort --------------
  if (facts.midtermPublished && !facts.midtermComplete) {
    flags.push({ code: 'midterm_incomplete', severity: 'warn' });
  }
  if (facts.finalPublished && !facts.finalComplete) {
    flags.push({ code: 'final_incomplete', severity: 'warn' });
  }

  // Most severe first, stable within severity.
  const order: Record<RiskSeverity, number> = { risk: 0, warn: 1 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** The worst severity across a set of flags, or null when there are none. */
export function worstSeverity(flags: RiskFlag[]): RiskSeverity | null {
  if (flags.some((f) => f.severity === 'risk')) return 'risk';
  if (flags.some((f) => f.severity === 'warn')) return 'warn';
  return null;
}
