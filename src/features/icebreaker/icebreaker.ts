// Pure first-session icebreaker logic (experience-layer.md §1.17). No I/O: the
// shared-interest match, the prompt builder, the defensive parser, and the
// profile-only fallback are unit-tested so the AI boundary is isolated. The guide
// is generated from BOTH profiles when a pair is activated; the AI only suggests,
// and degrades to a profile-built guide when AI is off (CLAUDE.md §0 rule 5).

export interface IcebreakerContext {
  mentorName: string | null;
  menteeName: string | null;
  mentorInterests: string | null;
  menteeInterests: string | null;
  mentorWhatCanLearn: string | null; // what the mentor offers
  mentorCompetencies: string[];
  menteeCareerGoals: string | null; // what the mentee wants
  menteeWhyMentor: string | null; // why the mentee wants a mentor
  menteeCompetencies: string[]; // competencies the mentee wants to strengthen
}

export interface IcebreakerResult {
  sharedInterests: string[];
  openingQuestions: string[];
  whatMenteeWantsToLearn: string[];
  whatMentorOffers: string[];
  suggestedAgenda: string[];
}

const MAX_ITEMS = 8;

// Light first-meeting opening questions. Shown as-is when AI is unavailable, and
// given to the model as a seed otherwise.
const OPENING_QUESTIONS: Record<'EN' | 'FR', string[]> = {
  EN: [
    'What first drew you to this programme, and what do you hope to get from it?',
    'Tell me about a moment in your career you are proud of.',
    'Outside work, what keeps you busy or energised?',
    'How do you prefer to communicate and how often should we meet?',
    'What would make this mentorship a success for you in nine months?',
  ],
  FR: [
    'Qu’est-ce qui vous a attiré vers ce programme, et qu’espérez-vous en retirer ?',
    'Parlez-moi d’un moment de votre carrière dont vous êtes fier.',
    'En dehors du travail, qu’est-ce qui vous occupe ou vous stimule ?',
    'Comment préférez-vous communiquer et à quelle fréquence devrions-nous nous rencontrer ?',
    'Qu’est-ce qui ferait de ce mentorat une réussite pour vous dans neuf mois ?',
  ],
};

/** Split a free-text interests/competency string into normalized phrases. */
export function splitPhrases(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,;\n/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Interests present in BOTH profiles, matched case-insensitively but returned in
 * the mentor's original casing. Pure — the core of the icebreaker's "shared
 * interests" both when AI is on (seed) and off (fallback).
 */
export function sharedInterests(
  mentorInterests: string | null,
  menteeInterests: string | null,
): string[] {
  const mentor = splitPhrases(mentorInterests);
  const menteeLower = new Set(splitPhrases(menteeInterests).map((s) => s.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const phrase of mentor) {
    const key = phrase.toLowerCase();
    if (menteeLower.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(phrase);
    }
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

/** A safe, non-AI guide built only from the two profiles. Used when AI is
 *  disabled or its response is unusable. */
export function fallbackIcebreaker(context: IcebreakerContext, lang: 'EN' | 'FR'): IcebreakerResult {
  const wants = [
    ...splitPhrases(context.menteeCareerGoals),
    ...context.menteeCompetencies,
  ].slice(0, MAX_ITEMS);
  const offers = [
    ...splitPhrases(context.mentorWhatCanLearn),
    ...context.mentorCompetencies,
  ].slice(0, MAX_ITEMS);

  const agenda =
    lang === 'FR'
      ? [
          'Faire connaissance et partager vos parcours',
          'Échanger sur vos attentes et votre style de communication',
          'Convenir de la fréquence des rencontres et des prochaines étapes',
        ]
      : [
          'Get to know each other and share your backgrounds',
          'Talk through expectations and communication style',
          'Agree on meeting cadence and next steps',
        ];

  return {
    sharedInterests: sharedInterests(context.mentorInterests, context.menteeInterests),
    openingQuestions: OPENING_QUESTIONS[lang],
    whatMenteeWantsToLearn: wants,
    whatMentorOffers: offers,
    suggestedAgenda: agenda,
  };
}

/** Build the icebreaker prompt. Pure so the instruction is testable. */
export function buildIcebreakerPrompt(context: IcebreakerContext, lang: 'EN' | 'FR'): string {
  const languageName = lang === 'FR' ? 'French' : 'English';
  const line = (label: string, value: string | null | string[]) => {
    const text = Array.isArray(value) ? value.join(', ') : value;
    return `${label}: ${text && text.length ? text : '(not provided)'}`;
  };

  return [
    `Respond in ${languageName}.`,
    'You are the First-Session Icebreaker Assistant for a corporate mentorship programme.',
    'A mentor and mentee have just been paired and are about to meet for the first time.',
    'Using ONLY the profile facts below, write a warm, professional first-meeting guide.',
    'Do not invent facts not provided. Return ONLY strict JSON of this shape, each an',
    'array of short strings:',
    '{',
    '  "sharedInterests": string[],',
    '  "openingQuestions": string[],',
    '  "whatMenteeWantsToLearn": string[],',
    '  "whatMentorOffers": string[],',
    '  "suggestedAgenda": string[]',
    '}',
    'Keep each array to at most 6 concise items. Use [] when nothing is grounded.',
    '',
    line('Mentor', context.mentorName),
    line('Mentor interests', context.mentorInterests),
    line('What the mentor can offer', context.mentorWhatCanLearn),
    line('Mentor competencies', context.mentorCompetencies),
    line('Mentee', context.menteeName),
    line('Mentee interests', context.menteeInterests),
    line('Why the mentee wants a mentor', context.menteeWhyMentor),
    line('Mentee career goals', context.menteeCareerGoals),
    line('Competencies the mentee wants to strengthen', context.menteeCompetencies),
    'Seed opening questions you may adapt:',
    OPENING_QUESTIONS[lang].map((q) => `- ${q}`).join('\n'),
  ].join('\n');
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    const s = typeof entry === 'string' ? entry.trim() : '';
    if (s) out.push(s);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

/**
 * Defensive parser for the assistant's JSON. Returns null on anything unusable so
 * the caller falls back to the profile-built guide instead of throwing. Tolerates
 * models that wrap JSON in prose or code fences.
 */
export function parseIcebreakerResponse(raw: string): IcebreakerResult | null {
  if (!raw || !raw.trim()) return null;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  const result: IcebreakerResult = {
    sharedInterests: strArray(obj.sharedInterests),
    openingQuestions: strArray(obj.openingQuestions),
    whatMenteeWantsToLearn: strArray(obj.whatMenteeWantsToLearn),
    whatMentorOffers: strArray(obj.whatMentorOffers),
    suggestedAgenda: strArray(obj.suggestedAgenda),
  };

  if (
    result.sharedInterests.length === 0 &&
    result.openingQuestions.length === 0 &&
    result.whatMenteeWantsToLearn.length === 0 &&
    result.whatMentorOffers.length === 0 &&
    result.suggestedAgenda.length === 0
  ) {
    return null;
  }
  return result;
}
