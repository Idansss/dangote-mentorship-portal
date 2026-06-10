/**
 * The matching engine (CLAUDE.md §8). A PURE function: no I/O, no clock, no
 * randomness — fully unit-testable. Callers load data and persist results.
 *
 * Layer 1 — hard rules (must never break):
 *   - Language must match exactly (EN↔EN, FR↔FR). NOT configurable. The single
 *     most important rule; tests assert cross-language pairs are impossible.
 *   - Mentor has remaining capacity.
 *   - Same active cohort.
 *   - Mentor completed required training; mentee completed onboarding.
 *   - Optional, cohort-configurable: not same reporting line; no flagged
 *     conflict of interest; mentor available.
 *
 * Layer 2 — weighted scoring (defaults admin-tunable per cohort):
 *   competency 30 · career-goal 25 · experience 20 · department 10 ·
 *   availability 10 · personality 5 → output 0–100.
 */

export type MatchLanguage = 'EN' | 'FR';

export interface MentorForMatching {
  id: string;
  cohortId: string;
  fullName: string;
  preferredLanguage: MatchLanguage;
  yearsExperience: number | null;
  department: string | null;
  availability: string | null;
  personality: string | null;
  maxMentees: number;
  /** Matches already committed (admin-approved or accepted). */
  currentMenteeCount: number;
  trainingComplete: boolean;
  /** Competency names the mentor offers. */
  competencies: string[];
  whatCanLearn: string | null;
  reportingLineKey?: string | null;
  conflictOfInterestWith?: string[];
}

export interface MenteeForMatching {
  id: string;
  cohortId: string;
  fullName: string;
  preferredLanguage: MatchLanguage;
  department: string | null;
  personality: string | null;
  onboardingComplete: boolean;
  careerGoals: string | null;
  /** Competency names the mentee wants to strengthen. */
  competenciesToStrengthen: string[];
  reportingLineKey?: string | null;
}

export interface MatchingWeights {
  competency: number;
  careerGoal: number;
  experience: number;
  department: number;
  availability: number;
  personality: number;
}

export interface MatchingHardRules {
  /** Optional cohort-configurable rules. Language matching is NOT here — it can never be disabled. */
  mentorMustHaveCapacity: boolean;
  mentorTrainingComplete: boolean;
  menteeOnboardingComplete: boolean;
  enforceDifferentReportingLine: boolean;
  enforceNoConflictOfInterest: boolean;
  mentorMustBeAvailable: boolean;
}

export interface MatchingCriteriaConfig {
  weights: MatchingWeights;
  hardRules: MatchingHardRules;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  competency: 30,
  careerGoal: 25,
  experience: 20,
  department: 10,
  availability: 10,
  personality: 5,
};

export const DEFAULT_HARD_RULES: MatchingHardRules = {
  mentorMustHaveCapacity: true,
  mentorTrainingComplete: true,
  menteeOnboardingComplete: true,
  enforceDifferentReportingLine: false,
  enforceNoConflictOfInterest: false,
  mentorMustBeAvailable: false,
};

export type HardRuleFailure =
  | 'LANGUAGE_MISMATCH'
  | 'NO_CAPACITY'
  | 'DIFFERENT_COHORT'
  | 'MENTOR_TRAINING_INCOMPLETE'
  | 'MENTEE_ONBOARDING_INCOMPLETE'
  | 'SAME_REPORTING_LINE'
  | 'CONFLICT_OF_INTEREST'
  | 'MENTOR_UNAVAILABLE';

export type MatchFlag =
  | 'MENTOR_NO_EXPERIENCE_DATA'
  | 'MENTOR_NO_COMPETENCIES'
  | 'MENTEE_NO_TARGET_COMPETENCIES'
  | 'MENTEE_NO_CAREER_GOALS'
  | 'MENTOR_NO_AVAILABILITY_DATA'
  | 'MENTOR_NEAR_CAPACITY'
  | 'WEAK_OVERALL_FIT';

export interface ScoreBreakdown {
  competency: number;
  careerGoal: number;
  experience: number;
  department: number;
  availability: number;
  personality: number;
}

export type MatchResult =
  | {
      eligible: false;
      score: 0;
      failedRules: HardRuleFailure[];
      rationale: string;
      flags: MatchFlag[];
    }
  | {
      eligible: true;
      score: number;
      failedRules: [];
      breakdown: ScoreBreakdown;
      rationale: string;
      flags: MatchFlag[];
    };

// ── Scoring helpers (all deterministic) ─────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'into', 'within', 'from', 'that', 'this', 'want',
  'wants', 'would', 'like', 'role', 'move', 'become', 'grow', 'months', 'years',
  'les', 'des', 'dans', 'pour', 'avec', 'une', 'mon', 'mes', 'devenir', 'vers',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-zà-ÿ0-9]+/i)
      .filter((t) => t.length > 3 && !STOPWORDS.has(t)),
  );
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Overlap between what the mentee wants to strengthen and what the mentor offers. */
function competencyFactor(mentor: MentorForMatching, mentee: MenteeForMatching): number {
  if (mentee.competenciesToStrengthen.length === 0 || mentor.competencies.length === 0) return 0;
  const offered = new Set(mentor.competencies.map(normalizeName));
  const wanted = mentee.competenciesToStrengthen.map(normalizeName);
  const matched = wanted.filter((w) => offered.has(w)).length;
  return matched / wanted.length;
}

/**
 * Career-goal alignment: token overlap between the mentee's stated goals and
 * the mentor's competencies + "what mentees can learn" text. Three or more
 * shared significant tokens count as full alignment.
 */
function careerGoalFactor(mentor: MentorForMatching, mentee: MenteeForMatching): number {
  if (!mentee.careerGoals) return 0;
  const goalTokens = tokenize(mentee.careerGoals);
  const mentorTokens = tokenize(
    [mentor.whatCanLearn ?? '', ...mentor.competencies].join(' '),
  );
  let matched = 0;
  for (const token of goalTokens) {
    if (mentorTokens.has(token)) matched += 1;
  }
  return Math.min(1, matched / 3);
}

/** Experience relevance bands: 15+ yrs → 1.0, 10+ → 0.85, 5+ → 0.6, 1+ → 0.4. */
function experienceFactor(mentor: MentorForMatching): number {
  const years = mentor.yearsExperience;
  if (years === null || years <= 0) return 0;
  if (years >= 15) return 1;
  if (years >= 10) return 0.85;
  if (years >= 5) return 0.6;
  return 0.4;
}

function departmentFactor(mentor: MentorForMatching, mentee: MenteeForMatching): number {
  if (!mentor.department || !mentee.department) return 0;
  return normalizeName(mentor.department) === normalizeName(mentee.department) ? 1 : 0;
}

function availabilityFactor(mentor: MentorForMatching): number {
  return mentor.availability && mentor.availability.trim().length > 0 ? 1 : 0;
}

/**
 * Personality compatibility: complementary pairs score highest, identical
 * styles score well, anything else is neutral. Deterministic heuristic —
 * the human admin always reviews the final pairing.
 */
const COMPLEMENTARY_PAIRS = new Set(['analytical|expressive', 'amiable|driver']);

function personalityFactor(mentor: MentorForMatching, mentee: MenteeForMatching): number {
  if (!mentor.personality || !mentee.personality) return 0;
  const a = normalizeName(mentor.personality);
  const b = normalizeName(mentee.personality);
  if (a === b) return 0.7;
  const key = [a, b].sort().join('|');
  return COMPLEMENTARY_PAIRS.has(key) ? 1 : 0.5;
}

// ── Hard rules ───────────────────────────────────────────────────────────────

function evaluateHardRules(
  mentor: MentorForMatching,
  mentee: MenteeForMatching,
  rules: MatchingHardRules,
): HardRuleFailure[] {
  const failures: HardRuleFailure[] = [];

  // The language rule is unconditional by design (CLAUDE.md §8): it is checked
  // before and regardless of the configurable rules and cannot be switched off.
  if (mentor.preferredLanguage !== mentee.preferredLanguage) {
    failures.push('LANGUAGE_MISMATCH');
  }

  if (mentor.cohortId !== mentee.cohortId) failures.push('DIFFERENT_COHORT');

  if (rules.mentorMustHaveCapacity && mentor.currentMenteeCount >= mentor.maxMentees) {
    failures.push('NO_CAPACITY');
  }
  if (rules.mentorTrainingComplete && !mentor.trainingComplete) {
    failures.push('MENTOR_TRAINING_INCOMPLETE');
  }
  if (rules.menteeOnboardingComplete && !mentee.onboardingComplete) {
    failures.push('MENTEE_ONBOARDING_INCOMPLETE');
  }
  if (
    rules.enforceDifferentReportingLine &&
    mentor.reportingLineKey &&
    mentee.reportingLineKey &&
    mentor.reportingLineKey === mentee.reportingLineKey
  ) {
    failures.push('SAME_REPORTING_LINE');
  }
  if (
    rules.enforceNoConflictOfInterest &&
    (mentor.conflictOfInterestWith ?? []).includes(mentee.id)
  ) {
    failures.push('CONFLICT_OF_INTEREST');
  }
  if (rules.mentorMustBeAvailable && availabilityFactor(mentor) === 0) {
    failures.push('MENTOR_UNAVAILABLE');
  }

  return failures;
}

// ── Flags & rationale ────────────────────────────────────────────────────────

function collectFlags(
  mentor: MentorForMatching,
  mentee: MenteeForMatching,
  score: number,
): MatchFlag[] {
  const flags: MatchFlag[] = [];
  if (mentor.yearsExperience === null || mentor.yearsExperience <= 0) {
    flags.push('MENTOR_NO_EXPERIENCE_DATA');
  }
  if (mentor.competencies.length === 0) flags.push('MENTOR_NO_COMPETENCIES');
  if (mentee.competenciesToStrengthen.length === 0) flags.push('MENTEE_NO_TARGET_COMPETENCIES');
  if (!mentee.careerGoals) flags.push('MENTEE_NO_CAREER_GOALS');
  if (!mentor.availability) flags.push('MENTOR_NO_AVAILABILITY_DATA');
  if (mentor.maxMentees - mentor.currentMenteeCount === 1) flags.push('MENTOR_NEAR_CAPACITY');
  if (score < 40) flags.push('WEAK_OVERALL_FIT');
  return flags;
}

const LANGUAGE_LABEL: Record<MatchLanguage, string> = { EN: 'English', FR: 'French' };

function buildRationale(
  mentor: MentorForMatching,
  mentee: MenteeForMatching,
  breakdown: ScoreBreakdown,
  weights: MatchingWeights,
): string {
  const parts: string[] = [`Same language: ${LANGUAGE_LABEL[mentor.preferredLanguage]}.`];

  const offered = new Set(mentor.competencies.map(normalizeName));
  const matchedCompetencies = mentee.competenciesToStrengthen.filter((c) =>
    offered.has(normalizeName(c)),
  );
  if (matchedCompetencies.length > 0) {
    parts.push(
      `Mentor offers ${matchedCompetencies.join(', ')} — competencies the mentee wants to strengthen.`,
    );
  }
  if (mentor.yearsExperience !== null && mentor.yearsExperience > 0) {
    parts.push(
      `Mentor has ${mentor.yearsExperience} yrs experience${mentor.department ? ` in ${mentor.department}` : ''}.`,
    );
  }
  if (weights.careerGoal > 0 && breakdown.careerGoal > 0 && mentee.careerGoals) {
    parts.push('Career goals align with what this mentor can teach.');
  }
  if (breakdown.department > 0) parts.push('Same department/function.');
  if (breakdown.availability > 0) parts.push('Mentor availability is confirmed.');

  return parts.join(' ');
}

const FAILURE_TEXT: Record<HardRuleFailure, string> = {
  LANGUAGE_MISMATCH: 'Languages differ — pairing is not allowed.',
  NO_CAPACITY: 'Mentor has no remaining mentee capacity.',
  DIFFERENT_COHORT: 'Mentor and mentee are in different cohorts.',
  MENTOR_TRAINING_INCOMPLETE: 'Mentor has not completed required training.',
  MENTEE_ONBOARDING_INCOMPLETE: 'Mentee has not completed onboarding.',
  SAME_REPORTING_LINE: 'Mentor and mentee share a reporting line.',
  CONFLICT_OF_INTEREST: 'A conflict of interest is flagged for this pair.',
  MENTOR_UNAVAILABLE: 'Mentor has no stated availability.',
};

// ── The engine ───────────────────────────────────────────────────────────────

export function scoreMatch(
  mentor: MentorForMatching,
  mentee: MenteeForMatching,
  criteria?: Partial<MatchingCriteriaConfig>,
): MatchResult {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS, ...criteria?.weights };
  const hardRules: MatchingHardRules = { ...DEFAULT_HARD_RULES, ...criteria?.hardRules };

  const failedRules = evaluateHardRules(mentor, mentee, hardRules);
  if (failedRules.length > 0) {
    return {
      eligible: false,
      score: 0,
      failedRules,
      rationale: failedRules.map((f) => FAILURE_TEXT[f]).join(' '),
      flags: collectFlags(mentor, mentee, 0),
    };
  }

  const factors: ScoreBreakdown = {
    competency: competencyFactor(mentor, mentee),
    careerGoal: careerGoalFactor(mentor, mentee),
    experience: experienceFactor(mentor),
    department: departmentFactor(mentor, mentee),
    availability: availabilityFactor(mentor),
    personality: personalityFactor(mentor, mentee),
  };

  const totalWeight =
    weights.competency +
    weights.careerGoal +
    weights.experience +
    weights.department +
    weights.availability +
    weights.personality;

  const weighted =
    factors.competency * weights.competency +
    factors.careerGoal * weights.careerGoal +
    factors.experience * weights.experience +
    factors.department * weights.department +
    factors.availability * weights.availability +
    factors.personality * weights.personality;

  const score = totalWeight === 0 ? 0 : Math.round((weighted / totalWeight) * 100);

  const breakdown: ScoreBreakdown = {
    competency: Math.round(factors.competency * weights.competency),
    careerGoal: Math.round(factors.careerGoal * weights.careerGoal),
    experience: Math.round(factors.experience * weights.experience),
    department: Math.round(factors.department * weights.department),
    availability: Math.round(factors.availability * weights.availability),
    personality: Math.round(factors.personality * weights.personality),
  };

  return {
    eligible: true,
    score,
    failedRules: [],
    breakdown,
    rationale: buildRationale(mentor, mentee, breakdown, weights),
    flags: collectFlags(mentor, mentee, score),
  };
}
