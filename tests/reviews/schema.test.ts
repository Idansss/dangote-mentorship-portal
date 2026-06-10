import { describe, expect, it } from 'vitest';
import type { FormSchemaShape } from '@/features/forms/schema';
import { validateAnswers, submitReviewSchema, reviewDraftKey } from '@/features/reviews/schema';

// The review answer validator is the response-side counterpart to the Forms
// Builder schema and is built dynamically from whatever the admin published, so
// it gets full unit coverage (CLAUDE.md §0 rule 4: validation is non-negotiable).

function form(fields: FormSchemaShape['fields']): FormSchemaShape {
  return { fields };
}

const shortText = { id: 'name', labelEn: 'Name', labelFr: 'Nom', type: 'short_text' as const, required: true };
const longText = { id: 'notes', labelEn: 'Notes', labelFr: 'Notes', type: 'long_text' as const, required: false };
const rating = { id: 'score', labelEn: 'Score', labelFr: 'Note', type: 'rating' as const, required: true, max: 5 };
const select = {
  id: 'useful',
  labelEn: 'Useful?',
  labelFr: 'Utile ?',
  type: 'single_select' as const,
  required: true,
  options: [
    { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
    { value: 'no', labelEn: 'No', labelFr: 'Non' },
  ],
};
const boolean = { id: 'met', labelEn: 'Met?', labelFr: 'Rencontré ?', type: 'boolean' as const, required: true };

describe('validateAnswers — required enforcement', () => {
  it('flags a blank required field', () => {
    const result = validateAnswers(form([shortText]), { name: '   ' });
    expect(result.ok).toBe(false);
    expect(result.fieldErrors.name).toBeDefined();
  });

  it('allows a blank optional field and records it as null', () => {
    const result = validateAnswers(form([longText]), { notes: '' });
    expect(result.ok).toBe(true);
    expect(result.answers.notes).toBeNull();
  });

  it('treats a missing key as blank', () => {
    const result = validateAnswers(form([shortText]), {});
    expect(result.ok).toBe(false);
  });
});

describe('validateAnswers — text', () => {
  it('trims and accepts text', () => {
    const result = validateAnswers(form([shortText]), { name: '  Ada  ' });
    expect(result.ok).toBe(true);
    expect(result.answers.name).toBe('Ada');
  });

  it('rejects short_text over 500 chars', () => {
    const result = validateAnswers(form([shortText]), { name: 'x'.repeat(501) });
    expect(result.ok).toBe(false);
  });

  it('accepts long_text up to 5000 chars', () => {
    const result = validateAnswers(form([{ ...longText, required: true }]), { notes: 'y'.repeat(5000) });
    expect(result.ok).toBe(true);
  });
});

describe('validateAnswers — rating', () => {
  it('coerces a numeric string within bounds', () => {
    const result = validateAnswers(form([rating]), { score: '4' });
    expect(result.ok).toBe(true);
    expect(result.answers.score).toBe(4);
  });

  it('rejects 0 and above-max ratings', () => {
    expect(validateAnswers(form([rating]), { score: '0' }).ok).toBe(false);
    expect(validateAnswers(form([rating]), { score: '6' }).ok).toBe(false);
  });

  it('rejects a non-integer rating', () => {
    expect(validateAnswers(form([rating]), { score: '3.5' }).ok).toBe(false);
  });

  it('defaults the rating ceiling to 5 when max is omitted', () => {
    const noMax = { ...rating, max: undefined };
    expect(validateAnswers(form([noMax]), { score: '5' }).ok).toBe(true);
    expect(validateAnswers(form([noMax]), { score: '6' }).ok).toBe(false);
  });
});

describe('validateAnswers — single_select', () => {
  it('accepts a known option value', () => {
    const result = validateAnswers(form([select]), { useful: 'yes' });
    expect(result.ok).toBe(true);
    expect(result.answers.useful).toBe('yes');
  });

  it('rejects a value not in the option set', () => {
    expect(validateAnswers(form([select]), { useful: 'maybe' }).ok).toBe(false);
  });
});

describe('validateAnswers — boolean', () => {
  it('coerces yes/true to true and no/false to false', () => {
    expect(validateAnswers(form([boolean]), { met: 'true' }).answers.met).toBe(true);
    expect(validateAnswers(form([boolean]), { met: 'yes' }).answers.met).toBe(true);
    expect(validateAnswers(form([boolean]), { met: 'false' }).answers.met).toBe(false);
    expect(validateAnswers(form([boolean]), { met: 'no' }).answers.met).toBe(false);
  });

  it('rejects an unrecognized boolean value', () => {
    expect(validateAnswers(form([boolean]), { met: 'maybe' }).ok).toBe(false);
  });
});

describe('validateAnswers — whole form', () => {
  it('ignores answers to questions the form no longer has (stale draft)', () => {
    const result = validateAnswers(form([shortText]), { name: 'Ada', removed_field: 'stale' });
    expect(result.ok).toBe(true);
    expect(result.answers).not.toHaveProperty('removed_field');
  });

  it('collects every field error, not just the first', () => {
    const result = validateAnswers(form([shortText, rating, select]), {
      name: '',
      score: '99',
      useful: 'nope',
    });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.fieldErrors).sort()).toEqual(['name', 'score', 'useful']);
  });
});

describe('submitReviewSchema', () => {
  const valid = {
    formId: 'ckv1234567890abcdefghijklm',
    type: 'MIDTERM',
    answers: JSON.stringify({ name: 'Ada' }),
  };

  it('parses a valid payload and decodes the answers JSON', () => {
    const result = submitReviewSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.answers).toEqual({ name: 'Ada' });
  });

  it('rejects malformed answers JSON', () => {
    expect(submitReviewSchema.safeParse({ ...valid, answers: '{ not json' }).success).toBe(false);
  });

  it('accepts the FINAL review type', () => {
    const result = submitReviewSchema.safeParse({ ...valid, type: 'FINAL' });
    expect(result.success && result.data.type).toBe('FINAL');
  });

  it('rejects an invalid review type', () => {
    expect(submitReviewSchema.safeParse({ ...valid, type: 'WEEKLY' }).success).toBe(false);
  });

  it('rejects a non-cuid form id', () => {
    expect(submitReviewSchema.safeParse({ ...valid, formId: 'nope' }).success).toBe(false);
  });
});

describe('reviewDraftKey', () => {
  it('is stable and type-scoped', () => {
    expect(reviewDraftKey('MIDTERM' as never, 'abc')).toBe('review:MIDTERM:abc');
    expect(reviewDraftKey('FINAL' as never, 'abc')).toBe('review:FINAL:abc');
  });
});
