// Pure "What should I do next?" logic (experience-layer.md §1.3). No I/O: the
// candidate ranking, the prompt builder, and the defensive parser are unit-tested
// so the AI boundary is isolated. The server assembles the user's live candidates
// (each already a real, deep-linked fact); the AI only *chooses and phrases* one,
// and may never invent an item or a link not in the provided set. Degrades to the
// highest-priority candidate when AI is off (CLAUDE.md §0 rule 5).

export interface NextActionCandidate {
  /** Stable key for debugging/telemetry. */
  key: string;
  /** Higher = more urgent. Ties broken by array order. */
  priority: number;
  /** Already-localized one-line description of the action. */
  message: string;
  /** Deep link to where the action is performed. */
  link: string;
}

export interface NextAction {
  message: string;
  link: string;
}

/** The highest-priority candidate (stable on ties), or null when none. */
export function topCandidate(candidates: NextActionCandidate[]): NextActionCandidate | null {
  let best: NextActionCandidate | null = null;
  for (const c of candidates) {
    if (!best || c.priority > best.priority) best = c;
  }
  return best;
}

/** Deterministic fallback used when AI is off or its answer is unusable. */
export function fallbackNextAction(
  candidates: NextActionCandidate[],
  allCaughtUp: { message: string; link: string },
): NextAction {
  const top = topCandidate(candidates);
  if (!top) return allCaughtUp;
  return { message: top.message, link: top.link };
}

/** Build the next-action prompt. Pure so the instruction is testable. */
export function buildNextActionPrompt(candidates: NextActionCandidate[], lang: 'EN' | 'FR'): string {
  const languageName = lang === 'FR' ? 'French' : 'English';
  const list = candidates
    .map((c, i) => `${i + 1}. [link: ${c.link}] ${c.message}`)
    .join('\n');

  return [
    `Respond in ${languageName}.`,
    'You are the assistant for a corporate mentorship portal. Choose the SINGLE most',
    'important next action for this user from the candidate list below — and ONLY from',
    'that list. Never invent tasks, counts, or links that are not present.',
    'Return ONLY strict JSON of this shape:',
    '{ "message": string, "link": string }',
    'Rules: "link" MUST be copied exactly from one of the candidates. "message" is one',
    'or two short sentences telling the user what to do next, grounded only in the',
    'chosen candidate. Be warm, direct, and specific.',
    '',
    'Candidates (most urgent first is not guaranteed — you decide):',
    list,
  ].join('\n');
}

/**
 * Defensive parser. Returns null on anything unusable — including a link the model
 * invented that is not among the allowed candidate links — so the caller falls
 * back to the deterministic choice rather than surfacing a hallucinated action.
 */
export function parseNextActionResponse(raw: string, allowedLinks: readonly string[]): NextAction | null {
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

  const message = typeof obj.message === 'string' ? obj.message.trim() : '';
  const link = typeof obj.link === 'string' ? obj.link.trim() : '';
  if (!message || !link) return null;
  // Grounding guard: the link must be one we offered.
  if (!allowedLinks.includes(link)) return null;

  return { message, link };
}
