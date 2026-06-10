import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HARD_RULES,
  DEFAULT_WEIGHTS,
  scoreMatch,
  type MatchingHardRules,
  type MentorForMatching,
  type MenteeForMatching,
} from '@/features/matching/engine';

// ── Builders ────────────────────────────────────────────────────────────────

function mentor(overrides: Partial<MentorForMatching> = {}): MentorForMatching {
  return {
    id: 'mentor-1',
    cohortId: 'cohort-1',
    fullName: 'Aisha Okafor',
    preferredLanguage: 'EN',
    yearsExperience: 15,
    department: 'Cement',
    availability: 'Weekday evenings',
    personality: 'Analytical',
    maxMentees: 3,
    currentMenteeCount: 0,
    trainingComplete: true,
    competencies: ['Leadership', 'Stakeholder Management', 'Process Engineering'],
    whatCanLearn: 'Operational leadership and stakeholder management at scale',
    ...overrides,
  };
}

function mentee(overrides: Partial<MenteeForMatching> = {}): MenteeForMatching {
  return {
    id: 'mentee-1',
    cohortId: 'cohort-1',
    fullName: 'Chidi Eze',
    preferredLanguage: 'EN',
    department: 'Cement',
    personality: 'Expressive',
    onboardingComplete: true,
    careerGoals: 'Grow into operational leadership and stakeholder management',
    competenciesToStrengthen: ['Leadership', 'Stakeholder Management'],
    ...overrides,
  };
}

// ── Layer 1: the language hard rule (the single most important rule) ───────

describe('hard rule: language must match exactly', () => {
  it('rejects EN mentor with FR mentee', () => {
    const result = scoreMatch(mentor({ preferredLanguage: 'EN' }), mentee({ preferredLanguage: 'FR' }));
    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.failedRules).toContain('LANGUAGE_MISMATCH');
  });

  it('rejects FR mentor with EN mentee', () => {
    const result = scoreMatch(mentor({ preferredLanguage: 'FR' }), mentee({ preferredLanguage: 'EN' }));
    expect(result.eligible).toBe(false);
    expect(result.failedRules).toContain('LANGUAGE_MISMATCH');
  });

  it('cannot be disabled by criteria configuration (rule is unconditional)', () => {
    // Even a hostile/buggy config that disables every configurable rule and
    // zeroes/maxes weights must NOT allow a cross-language pair.
    const everythingOff = {
      mentorMustHaveCapacity: false,
      mentorTrainingComplete: false,
      menteeOnboardingComplete: false,
      enforceDifferentReportingLine: false,
      enforceNoConflictOfInterest: false,
      mentorMustBeAvailable: false,
    } satisfies MatchingHardRules;

    const result = scoreMatch(
      mentor({ preferredLanguage: 'EN' }),
      mentee({ preferredLanguage: 'FR' }),
      {
        hardRules: everythingOff,
        weights: { competency: 100, careerGoal: 100, experience: 100, department: 100, availability: 100, personality: 100 },
      },
    );
    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.failedRules).toContain('LANGUAGE_MISMATCH');
  });

  it('is impossible for every cross-language combination (exhaustive)', () => {
    const languages = ['EN', 'FR'] as const;
    for (const ml of languages) {
      for (const tl of languages) {
        const result = scoreMatch(mentor({ preferredLanguage: ml }), mentee({ preferredLanguage: tl }));
        if (ml === tl) {
          expect(result.failedRules).not.toContain('LANGUAGE_MISMATCH');
        } else {
          expect(result.eligible).toBe(false);
          expect(result.score).toBe(0);
          expect(result.failedRules).toContain('LANGUAGE_MISMATCH');
        }
      }
    }
  });

  it('allows FR↔FR pairs (French speakers are first-class)', () => {
    const result = scoreMatch(
      mentor({ preferredLanguage: 'FR' }),
      mentee({ preferredLanguage: 'FR' }),
    );
    expect(result.eligible).toBe(true);
  });
});

// ── Layer 1: remaining hard rules ───────────────────────────────────────────

describe('hard rules: capacity, cohort, training, onboarding', () => {
  it('rejects a mentor at capacity', () => {
    const result = scoreMatch(mentor({ maxMentees: 2, currentMenteeCount: 2 }), mentee());
    expect(result.eligible).toBe(false);
    expect(result.failedRules).toContain('NO_CAPACITY');
  });

  it('rejects pairs from different cohorts', () => {
    const result = scoreMatch(mentor({ cohortId: 'cohort-A' }), mentee({ cohortId: 'cohort-B' }));
    expect(result.eligible).toBe(false);
    expect(result.failedRules).toContain('DIFFERENT_COHORT');
  });

  it('rejects mentors with incomplete training', () => {
    const result = scoreMatch(mentor({ trainingComplete: false }), mentee());
    expect(result.eligible).toBe(false);
    expect(result.failedRules).toContain('MENTOR_TRAINING_INCOMPLETE');
  });

  it('rejects mentees with incomplete onboarding', () => {
    const result = scoreMatch(mentor(), mentee({ onboardingComplete: false }));
    expect(result.eligible).toBe(false);
    expect(result.failedRules).toContain('MENTEE_ONBOARDING_INCOMPLETE');
  });

  it('reports multiple failures at once', () => {
    const result = scoreMatch(
      mentor({ preferredLanguage: 'FR', trainingComplete: false, maxMentees: 1, currentMenteeCount: 1 }),
      mentee({ preferredLanguage: 'EN' }),
    );
    expect(result.eligible).toBe(false);
    expect(result.failedRules).toEqual(
      expect.arrayContaining(['LANGUAGE_MISMATCH', 'NO_CAPACITY', 'MENTOR_TRAINING_INCOMPLETE']),
    );
  });
});

describe('hard rules: optional cohort-configurable rules', () => {
  it('same reporting line rejected only when enforced', () => {
    const m = mentor({ reportingLineKey: 'ops-west' });
    const t = mentee({ reportingLineKey: 'ops-west' });
    expect(scoreMatch(m, t).eligible).toBe(true); // default: off
    const enforced = scoreMatch(m, t, {
      hardRules: { ...DEFAULT_HARD_RULES, enforceDifferentReportingLine: true },
    });
    expect(enforced.eligible).toBe(false);
    expect(enforced.failedRules).toContain('SAME_REPORTING_LINE');
  });

  it('conflict of interest rejected only when enforced', () => {
    const m = mentor({ conflictOfInterestWith: ['mentee-1'] });
    expect(scoreMatch(m, mentee()).eligible).toBe(true); // default: off
    const enforced = scoreMatch(m, mentee(), {
      hardRules: { ...DEFAULT_HARD_RULES, enforceNoConflictOfInterest: true },
    });
    expect(enforced.eligible).toBe(false);
    expect(enforced.failedRules).toContain('CONFLICT_OF_INTEREST');
  });

  it('availability requirement rejects only when enforced', () => {
    const m = mentor({ availability: null });
    expect(scoreMatch(m, mentee()).eligible).toBe(true); // default: off
    const enforced = scoreMatch(m, mentee(), {
      hardRules: { ...DEFAULT_HARD_RULES, mentorMustBeAvailable: true },
    });
    expect(enforced.eligible).toBe(false);
    expect(enforced.failedRules).toContain('MENTOR_UNAVAILABLE');
  });
});

// ── Layer 2: weighted scoring golden cases ─────────────────────────────────

describe('weighted scoring', () => {
  it('golden case: the ideal pair scores 100', () => {
    // All factors at max: full competency overlap, ≥3 career-goal tokens,
    // 15+ yrs, same dept, availability set, complementary personality.
    const result = scoreMatch(mentor(), mentee());
    expect(result.eligible).toBe(true);
    if (!result.eligible) throw new Error('unreachable');
    expect(result.breakdown).toEqual({
      competency: 30,
      careerGoal: 25,
      experience: 20,
      department: 10,
      availability: 10,
      personality: 5,
    });
    expect(result.score).toBe(100);
  });

  it('golden case: the empty-data pair scores 0 but stays eligible', () => {
    const result = scoreMatch(
      mentor({
        yearsExperience: null,
        department: null,
        availability: null,
        personality: null,
        competencies: [],
        whatCanLearn: null,
      }),
      mentee({
        department: null,
        personality: null,
        careerGoals: null,
        competenciesToStrengthen: [],
      }),
    );
    expect(result.eligible).toBe(true);
    if (!result.eligible) throw new Error('unreachable');
    expect(result.score).toBe(0);
    expect(result.flags).toEqual(
      expect.arrayContaining([
        'MENTOR_NO_EXPERIENCE_DATA',
        'MENTOR_NO_COMPETENCIES',
        'MENTEE_NO_TARGET_COMPETENCIES',
        'MENTEE_NO_CAREER_GOALS',
        'MENTOR_NO_AVAILABILITY_DATA',
        'WEAK_OVERALL_FIT',
      ]),
    );
  });

  it('golden case: half competency overlap yields half the competency weight', () => {
    const result = scoreMatch(
      mentor({ competencies: ['Leadership'] }),
      mentee({ competenciesToStrengthen: ['Leadership', 'Financial Analysis'] }),
    );
    if (!result.eligible) throw new Error('expected eligible');
    expect(result.breakdown.competency).toBe(15); // 1/2 of 30
  });

  it('experience bands are applied', () => {
    const bands: Array<[number, number]> = [
      [20, 20], // >=15 → 1.0 * 20
      [12, 17], // >=10 → 0.85 * 20 = 17
      [7, 12], // >=5 → 0.6 * 20 = 12
      [2, 8], // >=1 → 0.4 * 20 = 8
    ];
    for (const [years, expected] of bands) {
      const result = scoreMatch(mentor({ yearsExperience: years }), mentee());
      if (!result.eligible) throw new Error('expected eligible');
      expect(result.breakdown.experience).toBe(expected);
    }
  });

  it('respects admin-tuned weights per cohort', () => {
    // Zero out everything except competency: full overlap → 100.
    const result = scoreMatch(mentor(), mentee(), {
      weights: { competency: 50, careerGoal: 0, experience: 0, department: 0, availability: 0, personality: 0 },
    });
    if (!result.eligible) throw new Error('expected eligible');
    expect(result.score).toBe(100);
  });

  it('score is always within 0–100', () => {
    const result = scoreMatch(mentor(), mentee(), {
      weights: { competency: 1000, careerGoal: 1000, experience: 1000, department: 1000, availability: 1000, personality: 1000 },
    });
    if (!result.eligible) throw new Error('expected eligible');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('is deterministic (same inputs → identical result)', () => {
    const a = scoreMatch(mentor(), mentee());
    const b = scoreMatch(mentor(), mentee());
    expect(a).toEqual(b);
  });

  it('uses the documented default weights', () => {
    expect(DEFAULT_WEIGHTS).toEqual({
      competency: 30,
      careerGoal: 25,
      experience: 20,
      department: 10,
      availability: 10,
      personality: 5,
    });
  });
});

// ── Rationale & flags ───────────────────────────────────────────────────────

describe('rationale and flags', () => {
  it('produces a human-readable rationale naming the shared language', () => {
    const result = scoreMatch(mentor(), mentee());
    expect(result.rationale).toContain('Same language: English.');
    expect(result.rationale).toContain('15 yrs experience');
  });

  it('explains hard-rule failures in plain language', () => {
    const result = scoreMatch(mentor({ preferredLanguage: 'FR' }), mentee({ preferredLanguage: 'EN' }));
    expect(result.rationale).toContain('Languages differ');
  });

  it('flags a mentor with one remaining slot as near capacity', () => {
    const result = scoreMatch(mentor({ maxMentees: 3, currentMenteeCount: 2 }), mentee());
    expect(result.flags).toContain('MENTOR_NEAR_CAPACITY');
  });
});
