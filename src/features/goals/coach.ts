import 'server-only';
import { getAiAdapter } from '@/lib/ai';
import {
  assessSmart,
  buildCoachPrompt,
  parseCoachResponse,
  type CoachSuggestion,
  type GoalDraftFields,
  type SmartAssessment,
} from './smart';

export interface CoachResult {
  /** Deterministic SMART readiness — always present, even with no AI. */
  assessment: SmartAssessment;
  /** AI rewrite suggestion, or null when AI is unconfigured or unusable. */
  suggestion: CoachSuggestion | null;
  /** True when an AI provider was available to attempt a rewrite. */
  aiEnabled: boolean;
}

const COACH_SYSTEM =
  'You are the Goal Coach for a corporate mentorship programme. You turn vague ' +
  'development goals into SMART goals. You only ever suggest — the mentee edits ' +
  'and the mentor approves. Never fabricate facts not present in the draft.';

/**
 * Goal Coach (CLAUDE.md §9.2, experience-layer.md §1.7). Server-side only. Runs
 * the deterministic SMART assessment regardless, and — when an AI provider is
 * configured — asks for a SMART rewrite. The result is advisory: nothing is
 * written to the database here (CLAUDE.md §0 rule 5). Degrades gracefully to the
 * assessment alone when AI is off or the response is unusable.
 */
export async function coachGoal(
  fields: GoalDraftFields,
  lang: 'EN' | 'FR',
): Promise<CoachResult> {
  const assessment = assessSmart(fields);
  const adapter = getAiAdapter();
  if (!adapter.enabled) {
    return { assessment, suggestion: null, aiEnabled: false };
  }

  try {
    const raw = await adapter.complete({
      system: COACH_SYSTEM,
      prompt: buildCoachPrompt(fields, lang),
      temperature: 0.3,
      maxTokens: 600,
    });
    return { assessment, suggestion: parseCoachResponse(raw), aiEnabled: true };
  } catch (error) {
    // A provider hiccup must never block goal-setting; fall back to the
    // assessment. Surface status only — never the prompt (CLAUDE.md §14).
    console.error('[goals] coach request failed', error);
    return { assessment, suggestion: null, aiEnabled: true };
  }
}
