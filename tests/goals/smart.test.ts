import { describe, expect, it } from 'vitest';
import { assessSmart, buildCoachPrompt, parseCoachResponse } from '@/features/goals/smart';

describe('assessSmart', () => {
  it('flags a vague one-line goal as mostly missing', () => {
    const result = assessSmart({ title: 'Get better' });
    expect(result.score).toBeLessThan(40);
    expect(result.missing).toContain('measurable');
    expect(result.missing).toContain('timeBound');
  });

  it('recognises a fully specified SMART goal', () => {
    const result = assessSmart({
      title: 'Lead a cross-functional cost-saving project',
      competency: 'Leadership',
      whyMatters: 'It positions me for a manager role.',
      learningActivity: 'Shadow my mentor on two steering committees.',
      successMeasure: 'Deliver a costed proposal adopted by the committee.',
      endDate: '2026-08-01',
    });
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });
});

describe('buildCoachPrompt', () => {
  it('asks for strict JSON and respects the requested language', () => {
    const prompt = buildCoachPrompt({ title: 'improve communication' }, 'FR');
    expect(prompt).toContain('Respond in French.');
    expect(prompt).toContain('strict JSON');
    expect(prompt).toContain('improve communication');
  });
});

describe('parseCoachResponse', () => {
  it('parses clean JSON', () => {
    const out = parseCoachResponse(
      '{"title":"A","successMeasure":"B","learningActivity":"C","rationale":"D"}',
    );
    expect(out).toEqual({ title: 'A', successMeasure: 'B', learningActivity: 'C', rationale: 'D' });
  });

  it('tolerates prose/code-fence wrapping around the JSON', () => {
    const out = parseCoachResponse('Here you go:\n```json\n{"title":"X"}\n```\nHope that helps!');
    expect(out?.title).toBe('X');
  });

  it('returns null for unparseable or empty content', () => {
    expect(parseCoachResponse('not json at all')).toBeNull();
    expect(parseCoachResponse('')).toBeNull();
    expect(parseCoachResponse('{"title":"","successMeasure":"","learningActivity":""}')).toBeNull();
  });
});
