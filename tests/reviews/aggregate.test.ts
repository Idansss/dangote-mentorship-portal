import { describe, expect, it } from 'vitest';
import type { FormField } from '@/features/forms/schema';
import {
  aggregateAnswers,
  completionPercent,
  type BooleanAggregate,
  type RatingAggregate,
  type SelectAggregate,
  type TextAggregate,
} from '@/features/reviews/aggregate';

// The executive roll-up is computed by a pure function, so it gets full unit
// coverage (CLAUDE.md §12, §0 rule 4 spirit).

const rating: FormField = { id: 'score', labelEn: 'Score', labelFr: 'Note', type: 'rating', required: true, max: 5 };
const select: FormField = {
  id: 'useful',
  labelEn: 'Useful?',
  labelFr: 'Utile ?',
  type: 'single_select',
  required: true,
  options: [
    { value: 'very', labelEn: 'Very', labelFr: 'Très' },
    { value: 'not', labelEn: 'Not', labelFr: 'Pas' },
  ],
};
const boolean: FormField = { id: 'met', labelEn: 'Met?', labelFr: 'Vu ?', type: 'boolean', required: true };
const text: FormField = { id: 'notes', labelEn: 'Notes', labelFr: 'Notes', type: 'long_text', required: false };

describe('aggregateAnswers — rating', () => {
  it('computes average, answered count, and distribution', () => {
    const [agg] = aggregateAnswers([rating], [
      { score: 5 },
      { score: 3 },
      { score: 4 },
    ]) as [RatingAggregate];
    expect(agg.average).toBe(4);
    expect(agg.answered).toBe(3);
    expect(agg.distribution).toEqual([0, 0, 1, 1, 1]);
  });

  it('reports a null average and ignores out-of-range/blank values', () => {
    const [agg] = aggregateAnswers([rating], [{ score: null }, { score: 9 }]) as [RatingAggregate];
    expect(agg.average).toBeNull();
    expect(agg.answered).toBe(0);
  });

  it('rounds the average to one decimal', () => {
    const [agg] = aggregateAnswers([rating], [{ score: 5 }, { score: 4 }]) as [RatingAggregate];
    expect(agg.average).toBe(4.5);
  });
});

describe('aggregateAnswers — single_select', () => {
  it('counts each option and only known values', () => {
    const [agg] = aggregateAnswers([select], [
      { useful: 'very' },
      { useful: 'very' },
      { useful: 'not' },
      { useful: 'garbage' },
      { useful: null },
    ]) as [SelectAggregate];
    expect(agg.answered).toBe(3);
    expect(agg.counts.find((c) => c.value === 'very')?.count).toBe(2);
    expect(agg.counts.find((c) => c.value === 'not')?.count).toBe(1);
  });
});

describe('aggregateAnswers — boolean', () => {
  it('tallies yes/no and answered', () => {
    const [agg] = aggregateAnswers([boolean], [
      { met: true },
      { met: true },
      { met: false },
      { met: null },
    ]) as [BooleanAggregate];
    expect(agg.yes).toBe(2);
    expect(agg.no).toBe(1);
    expect(agg.answered).toBe(3);
  });
});

describe('aggregateAnswers — text', () => {
  it('counts only non-empty written answers', () => {
    const [agg] = aggregateAnswers([text], [{ notes: 'hello' }, { notes: '' }, { notes: null }]) as [
      TextAggregate,
    ];
    expect(agg.type).toBe('text');
    expect(agg.answered).toBe(1);
  });
});

describe('completionPercent', () => {
  it('rounds and guards divide-by-zero', () => {
    expect(completionPercent(3, 4)).toBe(75);
    expect(completionPercent(0, 0)).toBe(0);
    expect(completionPercent(1, 3)).toBe(33);
  });
});
