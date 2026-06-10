import 'server-only';
import { createAnthropicAdapter } from './anthropic';
import type { AiAdapter, AiScore } from './types';

export type { AiAdapter, AiLanguage, AiScore } from './types';

// When no provider key is configured, AI features degrade gracefully: every
// assistant is advisory by design (CLAUDE.md §9), so an empty suggestion is
// always a safe result. Callers check `adapter.enabled` to hide AI UI.
const disabledAdapter: AiAdapter = {
  id: 'disabled',
  enabled: false,
  async complete(): Promise<string> {
    return '';
  },
  async translate(): Promise<string> {
    return '';
  },
  async summarize(): Promise<string> {
    return '';
  },
  async score(): Promise<AiScore> {
    return { score: 0, reasoning: 'AI is not configured.' };
  },
};

let cached: AiAdapter | null = null;

export function getAiAdapter(): AiAdapter {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  cached = apiKey ? createAnthropicAdapter(apiKey) : disabledAdapter;
  return cached;
}
