import { describe, expect, it } from 'vitest';
import {
  buildNextActionPrompt,
  fallbackNextAction,
  parseNextActionResponse,
  topCandidate,
  type NextActionCandidate,
} from '@/features/next-action/next-action';

// §1.3 must never hallucinate an action not in the provided state. The grounding
// guard (link must be an offered link) is the safety-critical rule, tested here.

const candidates: NextActionCandidate[] = [
  { key: 'schedule', priority: 40, message: 'Schedule your next session.', link: '/meetings' },
  { key: 'review', priority: 85, message: 'Review your mentor’s feedback on a goal.', link: '/goals' },
  { key: 'confirm', priority: 75, message: 'Confirm whether your last meeting happened.', link: '/meetings' },
];

const caughtUp = { message: "You're all caught up.", link: '/dashboard' };

describe('topCandidate', () => {
  it('returns the highest-priority candidate', () => {
    expect(topCandidate(candidates)?.key).toBe('review');
  });
  it('returns null for an empty list', () => {
    expect(topCandidate([])).toBeNull();
  });
});

describe('fallbackNextAction', () => {
  it('picks the top candidate when present', () => {
    expect(fallbackNextAction(candidates, caughtUp)).toEqual({
      message: 'Review your mentor’s feedback on a goal.',
      link: '/goals',
    });
  });
  it('returns the caught-up message when there are no candidates', () => {
    expect(fallbackNextAction([], caughtUp)).toEqual(caughtUp);
  });
});

describe('buildNextActionPrompt', () => {
  it('lists every candidate link and forbids invention', () => {
    const prompt = buildNextActionPrompt(candidates, 'EN');
    expect(prompt).toContain('/goals');
    expect(prompt).toContain('/meetings');
    expect(prompt).toMatch(/Never invent/i);
    expect(prompt).toContain('Respond in English');
  });
});

describe('parseNextActionResponse', () => {
  const allowed = ['/goals', '/meetings'];

  it('parses a grounded answer', () => {
    const raw = '{"message":"Review your mentor’s feedback first.","link":"/goals"}';
    expect(parseNextActionResponse(raw, allowed)).toEqual({
      message: 'Review your mentor’s feedback first.',
      link: '/goals',
    });
  });

  it('REJECTS a hallucinated link not among the candidates', () => {
    const raw = '{"message":"Do this made-up thing.","link":"/somewhere-else"}';
    expect(parseNextActionResponse(raw, allowed)).toBeNull();
  });

  it('returns null for empty message, missing fields, or non-JSON', () => {
    expect(parseNextActionResponse('{"message":"","link":"/goals"}', allowed)).toBeNull();
    expect(parseNextActionResponse('{"link":"/goals"}', allowed)).toBeNull();
    expect(parseNextActionResponse('not json', allowed)).toBeNull();
  });
});
