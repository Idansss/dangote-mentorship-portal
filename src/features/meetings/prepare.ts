// Pure AI meeting-preparation logic (experience-layer.md §1.5). No I/O: the
// prompt builder, the defensive parser, and the Mentor-Guide question bank are
// unit-tested so the AI boundary is isolated. The Prepare view always shows the
// real context (previous summary, pending action items, goals); the AI only
// *suggests* agenda/questions/challenges/resources, and degrades to the static
// question bank when AI is off (CLAUDE.md §0 rule 5).

export interface PrepActionItem {
  title: string;
  owner: string | null;
  due: string | null;
  status: string;
}

export interface MeetingPrepContext {
  meetingTitle: string;
  meetingType: string;
  counterpartName: string | null;
  previousSessionSummary: string | null;
  previousSessionDate: string | null;
  pendingActionItems: PrepActionItem[];
  goalTitles: string[];
}

export interface MeetingPrepResult {
  suggestedAgenda: string[];
  suggestedQuestions: string[];
  challengesToDiscuss: string[];
  recommendedResources: string[];
}

const MAX_ITEMS = 8;

// Open, coaching-style questions from the Mentor Guide (GROW + reflective). Shown
// as-is when AI is unavailable, and given to the model as a seed otherwise.
export const MENTOR_GUIDE_QUESTIONS: Record<'EN' | 'FR', string[]> = {
  EN: [
    'What has gone well since we last met, and what made the difference?',
    'What is the most important thing you want to get from today?',
    'What options have you considered, and what is holding you back?',
    'What would success look like for this goal in one month?',
    'What support do you need from me, and from others?',
    'What is one action you will commit to before our next session?',
  ],
  FR: [
    'Qu’est-ce qui s’est bien passé depuis notre dernière rencontre, et pourquoi ?',
    'Quelle est la chose la plus importante que vous souhaitez retirer d’aujourd’hui ?',
    'Quelles options avez-vous envisagées, et qu’est-ce qui vous freine ?',
    'À quoi ressemblerait la réussite de cet objectif dans un mois ?',
    'De quel soutien avez-vous besoin de ma part, et de celle des autres ?',
    'Quelle action vous engagez-vous à entreprendre avant notre prochaine séance ?',
  ],
};

/** A safe, non-AI result: the Mentor-Guide questions plus the pending items as
 *  agenda lines. Used when AI is disabled or its response is unusable. */
export function fallbackPrep(context: MeetingPrepContext, lang: 'EN' | 'FR'): MeetingPrepResult {
  const agenda: string[] = [];
  if (context.previousSessionSummary) {
    agenda.push(lang === 'FR' ? 'Faire le point sur la séance précédente' : 'Recap the previous session');
  }
  for (const item of context.pendingActionItems.slice(0, MAX_ITEMS)) {
    agenda.push(
      (lang === 'FR' ? 'Suivi : ' : 'Follow up: ') + item.title,
    );
  }
  for (const goal of context.goalTitles.slice(0, MAX_ITEMS)) {
    agenda.push((lang === 'FR' ? 'Objectif : ' : 'Review goal: ') + goal);
  }
  return {
    suggestedAgenda: agenda,
    suggestedQuestions: MENTOR_GUIDE_QUESTIONS[lang],
    challengesToDiscuss: [],
    recommendedResources: [],
  };
}

/** Build the meeting-prep prompt. Pure so the instruction is testable. */
export function buildPreparePrompt(context: MeetingPrepContext, lang: 'EN' | 'FR'): string {
  const languageName = lang === 'FR' ? 'French' : 'English';
  const actions =
    context.pendingActionItems.length > 0
      ? context.pendingActionItems
          .map((a) => `- ${a.title} (${a.status}${a.owner ? `, ${a.owner}` : ''}${a.due ? `, due ${a.due}` : ''})`)
          .join('\n')
      : '(none)';
  const goals = context.goalTitles.length > 0 ? context.goalTitles.map((g) => `- ${g}`).join('\n') : '(none)';

  return [
    `Respond in ${languageName}.`,
    'You are the Meeting Preparation Assistant for a corporate mentorship programme.',
    'Using ONLY the context below, help both participants prepare for their session.',
    'Do not invent goals, action items, or facts that are not provided. Return ONLY',
    'strict JSON of this shape, each an array of short strings:',
    '{',
    '  "suggestedAgenda": string[],',
    '  "suggestedQuestions": string[],',
    '  "challengesToDiscuss": string[],',
    '  "recommendedResources": string[]',
    '}',
    'Base the agenda on the pending action items and goals. Draw questions from the',
    'mentor questioning tips. Keep each array to at most 6 concise items. Use [] when',
    'you have nothing grounded to suggest.',
    '',
    `Meeting: ${context.meetingTitle} (${context.meetingType})`,
    `Counterpart: ${context.counterpartName ?? '(unspecified)'}`,
    `Previous session (${context.previousSessionDate ?? 'n/a'}): ${context.previousSessionSummary ?? '(none on record)'}`,
    'Pending action items:',
    actions,
    'Goals on record:',
    goals,
    'Mentor questioning tips:',
    MENTOR_GUIDE_QUESTIONS[lang].map((q) => `- ${q}`).join('\n'),
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
 * the caller can fall back to the static prep, rather than throw. Tolerates models
 * that wrap JSON in prose/code fences.
 */
export function parsePrepareResponse(raw: string): MeetingPrepResult | null {
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

  const result: MeetingPrepResult = {
    suggestedAgenda: strArray(obj.suggestedAgenda),
    suggestedQuestions: strArray(obj.suggestedQuestions),
    challengesToDiscuss: strArray(obj.challengesToDiscuss),
    recommendedResources: strArray(obj.recommendedResources),
  };

  if (
    result.suggestedAgenda.length === 0 &&
    result.suggestedQuestions.length === 0 &&
    result.challengesToDiscuss.length === 0 &&
    result.recommendedResources.length === 0
  ) {
    return null;
  }
  return result;
}
