import { describe, expect, it } from 'vitest';
import {
  buildIcebreakerPrompt,
  fallbackIcebreaker,
  parseIcebreakerResponse,
  sharedInterests,
  splitPhrases,
  type IcebreakerContext,
} from '@/features/icebreaker/icebreaker';

// §1.17 is grounded strictly in the two profiles — like every AI surface in this
// layer, it must never fabricate. The pure core is tested so the boundary holds.

const context: IcebreakerContext = {
  mentorName: 'Amina',
  menteeName: 'Bola',
  mentorInterests: 'Football, Reading, Chess',
  menteeInterests: 'reading, hiking, chess',
  mentorWhatCanLearn: 'Stakeholder management; Leadership',
  mentorCompetencies: ['Strategy'],
  menteeCareerGoals: 'Become a plant manager',
  menteeWhyMentor: 'Grow into leadership',
  menteeCompetencies: ['Communication', 'Leadership'],
};

describe('splitPhrases', () => {
  it('splits on commas, semicolons, slashes and newlines and trims', () => {
    expect(splitPhrases('a, b; c\nd / e')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('returns [] for null/empty', () => {
    expect(splitPhrases(null)).toEqual([]);
    expect(splitPhrases('   ')).toEqual([]);
  });
});

describe('sharedInterests', () => {
  it('matches case-insensitively, returns the mentor casing, dedupes', () => {
    expect(sharedInterests(context.mentorInterests, context.menteeInterests)).toEqual([
      'Reading',
      'Chess',
    ]);
  });
  it('returns [] when there is no overlap or a side is empty', () => {
    expect(sharedInterests('Tennis', 'Golf')).toEqual([]);
    expect(sharedInterests(null, 'Golf')).toEqual([]);
  });
});

describe('fallbackIcebreaker', () => {
  it('builds a profile-only guide with shared interests, wants and offers', () => {
    const result = fallbackIcebreaker(context, 'EN');
    expect(result.sharedInterests).toEqual(['Reading', 'Chess']);
    expect(result.whatMenteeWantsToLearn).toContain('Become a plant manager');
    expect(result.whatMenteeWantsToLearn).toContain('Leadership');
    expect(result.whatMentorOffers).toContain('Stakeholder management');
    expect(result.openingQuestions.length).toBeGreaterThan(0);
    expect(result.suggestedAgenda.length).toBeGreaterThan(0);
  });
  it('localizes the agenda and questions to French', () => {
    const result = fallbackIcebreaker(context, 'FR');
    expect(result.suggestedAgenda[0]).toMatch(/connaissance/i);
  });
});

describe('buildIcebreakerPrompt', () => {
  it('includes both profiles and forbids inventing facts', () => {
    const prompt = buildIcebreakerPrompt(context, 'EN');
    expect(prompt).toContain('Become a plant manager');
    expect(prompt).toContain('Stakeholder management');
    expect(prompt).toMatch(/Do not invent/i);
    expect(prompt).toContain('Respond in English');
  });
  it('marks missing fields rather than omitting them', () => {
    const prompt = buildIcebreakerPrompt({ ...context, menteeCareerGoals: null }, 'EN');
    expect(prompt).toContain('(not provided)');
  });
});

describe('parseIcebreakerResponse', () => {
  it('parses JSON wrapped in prose / code fences', () => {
    const raw = 'Here you go:\n```json\n{"sharedInterests":["Chess"],"openingQuestions":[],"whatMenteeWantsToLearn":[],"whatMentorOffers":[],"suggestedAgenda":["Meet"]}\n```';
    expect(parseIcebreakerResponse(raw)).toEqual({
      sharedInterests: ['Chess'],
      openingQuestions: [],
      whatMenteeWantsToLearn: [],
      whatMentorOffers: [],
      suggestedAgenda: ['Meet'],
    });
  });
  it('returns null for empty, non-JSON, or all-empty results', () => {
    expect(parseIcebreakerResponse('')).toBeNull();
    expect(parseIcebreakerResponse('no json here')).toBeNull();
    expect(
      parseIcebreakerResponse('{"sharedInterests":[],"openingQuestions":[],"whatMenteeWantsToLearn":[],"whatMentorOffers":[],"suggestedAgenda":[]}'),
    ).toBeNull();
  });
});
