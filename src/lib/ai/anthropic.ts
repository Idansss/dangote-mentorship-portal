import 'server-only';
import type {
  AiAdapter,
  AiScore,
  CompleteOptions,
  ScoreOptions,
  SummarizeOptions,
  TranslateOptions,
} from './types';

// Anthropic Messages API implementation. Calls the REST API directly to keep
// the dependency surface small; the adapter interface hides this entirely.

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

export function createAnthropicAdapter(apiKey: string, model?: string): AiAdapter {
  const activeModel = model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  async function callMessages(options: CompleteOptions): Promise<string> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: activeModel,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.2,
        ...(options.system ? { system: options.system } : {}),
        messages: [{ role: 'user', content: options.prompt }],
      }),
    });

    if (!response.ok) {
      // Surface status only — never log prompt content (may contain PII, §14).
      throw new Error(`AI provider error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    return data.content
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('')
      .trim();
  }

  const LANGUAGE_NAME = { EN: 'English', FR: 'French' } as const;

  return {
    id: `anthropic:${activeModel}`,
    enabled: true,

    complete: callMessages,

    async translate({ text, sourceLang, targetLang }: TranslateOptions): Promise<string> {
      return callMessages({
        system:
          'You are a professional corporate translator for an African industrial conglomerate. ' +
          'Translate faithfully, keep tone and formatting, and return ONLY the translation.',
        prompt: `Translate the following ${LANGUAGE_NAME[sourceLang]} text to ${LANGUAGE_NAME[targetLang]}:\n\n${text}`,
        temperature: 0,
      });
    },

    async summarize({ text, instructions, lang }: SummarizeOptions): Promise<string> {
      return callMessages({
        system:
          'You summarize workplace mentorship content clearly and neutrally. ' +
          (lang ? `Respond in ${LANGUAGE_NAME[lang]}. ` : '') +
          'Return ONLY the summary.',
        prompt: `${instructions ?? 'Summarize the following.'}\n\n${text}`,
      });
    },

    async score({ task, input, criteria }: ScoreOptions): Promise<AiScore> {
      const raw = await callMessages({
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
