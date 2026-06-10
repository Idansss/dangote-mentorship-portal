import { describe, expect, it } from 'vitest';
import type { FieldAggregate } from '@/features/reviews/aggregate';
import {
  aggregateToLine,
  buildReviewReportPrompt,
  parseReviewReportResponse,
  type ReviewReportFacts,
} from '@/features/reviews/assistant';

// The AI Review Assistant's prompt builder and response parser are pure and unit-
// tested so the model boundary is exercised in isolation (CLAUDE.md §9.4).

describe('aggregateToLine', () => {
  it('renders a rating line with average and response count', () => {
    const agg: FieldAggregate = {
      fieldId: 's', type: 'rating', labelEn: 'Score', labelFr: 'Note', max: 5, answered: 4, average: 4.2, distribution: [0, 0, 1, 1, 2],
    };
    expect(aggregateToLine(agg, 'EN')).toBe('Score: average 4.2/5 (4 responses)');
  });

  it('renders a single_select tally and respects language', () => {
    const agg: FieldAggregate = {
      fieldId: 'u', type: 'single_select', labelEn: 'Useful?', labelFr: 'Utile ?', answered: 3,
      counts: [
        { value: 'y', labelEn: 'Yes', labelFr: 'Oui', count: 2 },
        { value: 'n', labelEn: 'No', labelFr: 'Non', count: 1 },
      ],
    };
    expect(aggregateToLine(agg, 'EN')).toBe('Useful?: Yes=2, No=1');
    expect(aggregateToLine(agg, 'FR')).toBe('Utile ?: Oui=2, Non=1');
  });

  it('renders boolean and text lines', () => {
    expect(
      aggregateToLine({ fieldId: 'm', type: 'boolean', labelEn: 'Met?', labelFr: 'Vu ?', answered: 3, yes: 2, no: 1 }, 'EN'),
    ).toBe('Met?: yes=2, no=1');
    expect(
      aggregateToLine({ fieldId: 't', type: 'text', labelEn: 'Notes', labelFr: 'Notes', answered: 5 }, 'EN'),
    ).toBe('Notes: 5 written responses');
  });
});

describe('buildReviewReportPrompt', () => {
  const facts: ReviewReportFacts = {
    type: 'MIDTERM',
    eligible: 10,
    submitted: 7,
    percent: 70,
    questionLines: ['Score: average 4/5 (7 responses)'],
    pairsMissing: ['Ada · Bola'],
  };

  it('grounds the model: instructs JSON-only and forbids invention', () => {
    const prompt = buildReviewReportPrompt(facts, 'EN');
    expect(prompt).toContain('ONLY strict');
    expect(prompt).toContain('Do not invent');
    expect(prompt).toContain('7 of 10');
    expect(prompt).toContain('Ada · Bola');
    expect(prompt).toContain('Respond in English.');
  });

  it('switches the response language to French', () => {
    expect(buildReviewReportPrompt(facts, 'FR')).toContain('Respond in French.');
  });

  it('handles empty question/pair lists gracefully', () => {
    const prompt = buildReviewReportPrompt({ ...facts, questionLines: [], pairsMissing: [] }, 'EN');
    expect(prompt).toContain('(no quantitative questions)');
    expect(prompt).toContain('(all pairs have completed this review)');
  });
});

describe('parseReviewReportResponse', () => {
  it('parses a valid JSON report', () => {
    const raw = JSON.stringify({
      summary: 'Good progress overall.',
      atRisk: ['Low completion in Batch C', ''],
      recommendations: ['Send reminders', 'Schedule a clinic'],
    });
    const report = parseReviewReportResponse(raw);
    expect(report?.summary).toBe('Good progress overall.');
    expect(report?.atRisk).toEqual(['Low completion in Batch C']); // blank dropped
    expect(report?.recommendations).toHaveLength(2);
  });

  it('tolerates prose-wrapped JSON', () => {
    const raw = 'Here is the report:\n```json\n{"summary":"S","atRisk":[],"recommendations":[]}\n```';
    expect(parseReviewReportResponse(raw)?.summary).toBe('S');
  });

  it('returns null on empty, malformed, or content-free responses', () => {
    expect(parseReviewReportResponse('')).toBeNull();
    expect(parseReviewReportResponse('not json')).toBeNull();
    expect(parseReviewReportResponse('{ broken')).toBeNull();
    expect(
      parseReviewReportResponse(JSON.stringify({ summary: '', atRisk: [], recommendations: [] })),
    ).toBeNull();
  });
});
