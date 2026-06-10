import 'server-only';
import { getAiAdapter } from '@/lib/ai';
import {
  buildSessionPrompt,
  parseSessionResponse,
  type SessionAssistantContext,
  type SessionAssistantResult,
} from './assistant';

export interface SessionSummaryOutcome {
  result: SessionAssistantResult | null;
  aiEnabled: boolean;
}

const SYSTEM =
  'You are the Session Assistant for a corporate mentorship programme. You convert ' +
  'rough notes into a clean, structured session log. You only suggest — a human ' +
  'reviews and saves. Never invent outcomes that are not in the notes.';

/**
 * Session Assistant (CLAUDE.md §9.3, experience-layer.md §1.4). Server-side only.
 * Converts rough notes into a structured log + extracted action items. Advisory:
 * nothing is written here (CLAUDE.md §0 rule 5). Degrades to null when AI is off
 * or the response is unusable, so the form simply stays manual.
 */
export async function summarizeSession(
  notes: string,
  context: SessionAssistantContext,
  lang: 'EN' | 'FR',
): Promise<SessionSummaryOutcome> {
  const adapter = getAiAdapter();
  if (!adapter.enabled) return { result: null, aiEnabled: false };

  try {
    const raw = await adapter.complete({
      system: SYSTEM,
      prompt: buildSessionPrompt(notes, context, lang),
      temperature: 0.2,
      maxTokens: 900,
    });
    return { result: parseSessionResponse(raw), aiEnabled: true };
  } catch (error) {
    // Surface status only — never the notes (CLAUDE.md §14).
    console.error('[sessions] assistant request failed', error);
    return { result: null, aiEnabled: true };
  }
}
