// Pure Session Assistant logic (CLAUDE.md §9.3, experience-layer.md §1.4). No
// I/O: the prompt builder and the defensive response parser are unit-tested so
// the AI boundary is tested in isolation. The assistant only ever SUGGESTS — the
// structured fields land editable and a human saves them (CLAUDE.md §0 rule 5).

export interface SessionAssistantContext {
  /** Goal titles for the pair, so the model can link the discussion to a goal. */
  goalTitles?: string[];
  menteeName?: string | null;
}

export interface SuggestedActionItem {
  task: string;
  owner: string | null;
  due: string | null;
}

export interface SessionAssistantResult {
  summary: string;
  competencyDiscussed: string;
  actionItems: SuggestedActionItem[];
  nextSteps: string;
  timeline: string;
  challenges: string;
  suggestedAgenda: string;
  riskFlag: boolean;
}

const MAX_ACTION_ITEMS = 10;

/** Build the Session Assistant prompt. Pure so the exact instruction is testable. */
export function buildSessionPrompt(
  notes: string,
  context: SessionAssistantContext,
  lang: 'EN' | 'FR',
): string {
  const languageName = lang === 'FR' ? 'French' : 'English';
  const goals =
    context.goalTitles && context.goalTitles.length > 0
      ? context.goalTitles.map((g) => `- ${g}`).join('\n')
      : '(none on record)';

  return [
    `Respond in ${languageName}.`,
    'You are the Session Assistant for a corporate mentorship programme. Turn the',
    'rough session notes below into a structured session log. Extract only what is',
    'in the notes — do not invent outcomes. Return ONLY strict JSON of this shape:',
    '{',
    '  "summary": string,',
    '  "competencyDiscussed": string,',
    '  "actionItems": [{"task": string, "owner": string, "due": string}],',
    '  "nextSteps": string,',
    '  "timeline": string,',
    '  "challenges": string,',
    '  "suggestedAgenda": string,',
    '  "riskFlag": boolean',
    '}',
    'Set "riskFlag" true only if the notes indicate the pairing is at risk (e.g. a',
    'missed or unproductive session, an unresolved blocker). Use "" / [] when a',
    'field is not present in the notes. "due" may be a date or a relative phrase.',
    '',
    `Mentee: ${context.menteeName ?? '(unspecified)'}`,
    'Goals on record:',
    goals,
    '',
    'Rough notes:',
    notes,
  ].join('\n');
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function parseActionItems(value: unknown): SuggestedActionItem[] {
  if (!Array.isArray(value)) return [];
  const items: SuggestedActionItem[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const obj = entry as Record<string, unknown>;
    const task = str(obj.task);
    if (!task) continue; // an action item with no task is meaningless
    items.push({ task, owner: str(obj.owner) || null, due: str(obj.due) || null });
    if (items.length >= MAX_ACTION_ITEMS) break;
  }
  return items;
}

/**
 * Defensive parser for the assistant's JSON. Returns null on anything unparseable
 * so the action can fall back to "no suggestion" rather than throw. Tolerates
 * models that wrap JSON in prose/code fences.
 */
export function parseSessionResponse(raw: string): SessionAssistantResult | null {
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

  const result: SessionAssistantResult = {
    summary: str(obj.summary),
    competencyDiscussed: str(obj.competencyDiscussed),
    actionItems: parseActionItems(obj.actionItems),
    nextSteps: str(obj.nextSteps),
    timeline: str(obj.timeline),
    challenges: str(obj.challenges),
    suggestedAgenda: str(obj.suggestedAgenda),
    riskFlag: obj.riskFlag === true,
  };

  // If the model returned nothing usable, treat it as no suggestion.
  if (!result.summary && result.actionItems.length === 0 && !result.nextSteps) {
    return null;
  }
  return result;
}
