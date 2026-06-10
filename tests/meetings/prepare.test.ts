import { describe, expect, it } from 'vitest';
import {
  buildPreparePrompt,
  parsePrepareResponse,
  fallbackPrep,
  MENTOR_GUIDE_QUESTIONS,
  type MeetingPrepContext,
} from '@/features/meetings/prepare';

const context: MeetingPrepContext = {
  meetingTitle: 'Monthly mentoring session',
  meetingType: 'ZOOM',
  counterpartName: 'Aisha',
  previousSessionSummary: 'Discussed stakeholder communication.',
  previousSessionDate: '2026-05-12',
  pendingActionItems: [
    { title: 'Draft a 5-minute update', owner: 'Aisha', due: '2026-06-15', status: 'IN_PROGRESS' },
  ],
  goalTitles: ['Strengthen stakeholder communication'],
};

describe('buildPreparePrompt', () => {
  it('grounds the prompt in the provided context and forbids invention', () => {
    const prompt = buildPreparePrompt(context, 'EN');
    expect(prompt).toContain('Respond in English.');
    expect(prompt).toContain('Do not invent');
    expect(prompt).toContain('Draft a 5-minute update');
    expect(prompt).toContain('Strengthen stakeholder communication');
    expect(prompt).toContain(MENTOR_GUIDE_QUESTIONS.EN[0]!);
  });

  it('respects French', () => {
    expect(buildPreparePrompt(context, 'FR')).toContain('Respond in French.');
  });
});

describe('parsePrepareResponse', () => {
  it('parses well-formed JSON arrays', () => {
    const raw = JSON.stringify({
      suggestedAgenda: ['Recap', 'Review goal'],
      suggestedQuestions: ['What went well?'],
      challengesToDiscuss: [],
      recommendedResources: ['Stakeholder comms guide'],
    });
    const result = parsePrepareResponse(raw)!;
    expect(result.suggestedAgenda).toEqual(['Recap', 'Review goal']);
    expect(result.recommendedResources).toEqual(['Stakeholder comms guide']);
  });

  it('tolerates prose/code-fence wrapping', () => {
    const raw = 'Here you go:\n```json\n{"suggestedAgenda":["A"],"suggestedQuestions":[],"challengesToDiscuss":[],"recommendedResources":[]}\n```';
    expect(parsePrepareResponse(raw)?.suggestedAgenda).toEqual(['A']);
  });

  it('drops empty strings and caps the list length', () => {
    const raw = JSON.stringify({ suggestedAgenda: ['a', '', '  ', ...Array(20).fill('x')] });
    const result = parsePrepareResponse(raw)!;
    expect(result.suggestedAgenda.length).toBeLessThanOrEqual(8);
    expect(result.suggestedAgenda).not.toContain('');
  });

  it('returns null on garbage or all-empty output', () => {
    expect(parsePrepareResponse('not json')).toBeNull();
    expect(parsePrepareResponse(JSON.stringify({ suggestedAgenda: [], suggestedQuestions: [] }))).toBeNull();
  });
});

describe('fallbackPrep', () => {
  it('builds agenda from pending items + goals and uses the guide questions', () => {
    const result = fallbackPrep(context, 'EN');
    expect(result.suggestedQuestions).toEqual(MENTOR_GUIDE_QUESTIONS.EN);
    expect(result.suggestedAgenda.some((a) => a.includes('Draft a 5-minute update'))).toBe(true);
    expect(result.suggestedAgenda.some((a) => a.includes('Strengthen stakeholder communication'))).toBe(true);
  });

  it('localizes the agenda labels', () => {
    expect(fallbackPrep(context, 'FR').suggestedAgenda.some((a) => a.startsWith('Suivi'))).toBe(true);
  });
});
