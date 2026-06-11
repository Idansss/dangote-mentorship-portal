import 'server-only';
import type {
  AiAdapter,
  AiScore,
  CompleteOptions,
  ScoreOptions,
  SummarizeOptions,
  TranslateOptions,
} from './types';

// Shared assistant logic. translate/summarize/score are pure wrappers around a
// provider's raw complete() — identical prompting regardless of vendor — so each
// provider implements only complete() and gets the rest for free. This keeps
// Anthropic and OpenAI behaviourally identical and prevents the two from drifting.

const LANGUAGE_NAME = { EN: 'English', FR: 'French' } as const;

export function adapterFromComplete(
  id: string,
  complete: (options: CompleteOptions) => Promise<string>,
): AiAdapter {
  return {
    id,
    enabled: true,

    complete,

    async translate({ text, sourceLang, targetLang }: TranslateOptions): Promise<string> {
      return complete({
        system:
          'You are a professional corporate translator for an African industrial conglomerate. ' +
          'Translate faithfully, keep tone and formatting, and return ONLY the translation.',
        prompt: `Translate the following ${LANGUAGE_NAME[sourceLang]} text to ${LANGUAGE_NAME[targetLang]}:\n\n${text}`,
        temperature: 0,
      });
    },

    async summarize({ text, instructions, lang }: SummarizeOptions): Promise<string> {
      return complete({
        system:
          'You summarize workplace mentorship content clearly and neutrally. ' +
          (lang ? `Respond in ${LANGUAGE_NAME[lang]}. ` : '') +
          'Return ONLY the summary.',
        prompt: `${instructions ?? 'Summarize the following.'}\n\n${text}`,
      });
    },

    async score({ task, input, criteria }: ScoreOptions): Promise<AiScore> {
      const raw = await complete({
        system:
          'You are an impartial evaluator. Respond with strict JSON: ' +
          '{"score": <integer 0-100>, "reasoning": "<one short paragraph>"} and nothing else.',
        prompt: `Task: ${task}\nCriteria: ${criteria}\n\nInput:\n${input}`,
        temperature: 0,
      });
      try {
        const parsed = JSON.parse(raw) as { score?: unknown; reasoning?: unknown };
        const score = typeof parsed.score === 'number' ? parsed.score : 0;
        return {
          score: Math.max(0, Math.min(100, Math.round(score))),
          reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
        };
      } catch {
        return { score: 0, reasoning: 'AI returned an unparseable response.' };
      }
    },
  };
}
