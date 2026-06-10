import { describe, expect, it } from 'vitest';
import { buildSessionPrompt, parseSessionResponse } from '@/features/sessions/assistant';

describe('buildSessionPrompt', () => {
  it('requests strict JSON in the chosen language and includes notes + goals', () => {
    const prompt = buildSessionPrompt('discussed presentation skills', {
      menteeName: 'Amara',
      goalTitles: ['Improve stakeholder communication'],
    }, 'FR');
    expect(prompt).toContain('Respond in French.');
    expect(prompt).toContain('strict JSON');
    expect(prompt).toContain('discussed presentation skills');
    expect(prompt).toContain('Improve stakeholder communication');
    expect(prompt).toContain('Amara');
  });

  it('handles no goals gracefully', () => {
    const prompt = buildSessionPrompt('notes', {}, 'EN');
    expect(prompt).toContain('(none on record)');
  });
});

describe('parseSessionResponse', () => {
  it('parses a full structured response', () => {
    const raw = JSON.stringify({
      summary: 'Discussed presentation skills and confidence.',
      competencyDiscussed: 'Communication',
      actionItems: [
        { task: 'Prepare a short presentation', owner: 'Amara', due: 'next session' },
        { task: 'Share feedback', owner: 'Mentor', due: '' },
      ],
      nextSteps: 'Rehearse together',
      timeline: '2 weeks',
      challenges: '',
      suggestedAgenda: 'Review the presentation',
      riskFlag: false,
    });
    const out = parseSessionResponse(raw)!;
    expect(out.summary).toContain('presentation');
    expect(out.actionItems).toHaveLength(2);
    expect(out.actionItems[0]).toEqual({
      task: 'Prepare a short presentation',
      owner: 'Amara',
      due: 'next session',
    });
    expect(out.actionItems[1]!.due).toBeNull();
    expect(out.riskFlag).toBe(false);
  });

  it('drops action items with no task and tolerates fenced JSON', () => {
    const out = parseSessionResponse(
      '```json\n{"summary":"S","actionItems":[{"task":""},{"task":"Real task"}]}\n```',
    )!;
    expect(out.actionItems).toHaveLength(1);
    expect(out.actionItems[0]!.task).toBe('Real task');
  });

  it('flags risk when the model sets riskFlag true', () => {
    const out = parseSessionResponse('{"summary":"Missed the session again","riskFlag":true}')!;
    expect(out.riskFlag).toBe(true);
  });

  it('returns null for unusable or empty content', () => {
    expect(parseSessionResponse('not json')).toBeNull();
    expect(parseSessionResponse('')).toBeNull();
    expect(parseSessionResponse('{"summary":"","actionItems":[],"nextSteps":""}')).toBeNull();
  });
});
