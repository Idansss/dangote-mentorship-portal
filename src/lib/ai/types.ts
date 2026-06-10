// Provider-agnostic AI adapter (CLAUDE.md §2). Feature code depends ONLY on
// this interface; swapping Anthropic ↔ Azure OpenAI touches lib/ai alone.
// All AI calls are server-side; keys never reach the client. AI output is
// always advisory — a human commits every write (CLAUDE.md §0 rule 5).

export type AiLanguage = 'EN' | 'FR';

export interface CompleteOptions {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TranslateOptions {
  text: string;
  sourceLang: AiLanguage;
  targetLang: AiLanguage;
}

export interface SummarizeOptions {
  text: string;
  instructions?: string;
  lang?: AiLanguage;
}

export interface ScoreOptions {
  /** What is being judged, e.g. "match-quality", "goal-smartness". */
  task: string;
  input: string;
  criteria: string;
}

export interface AiScore {
  score: number; // 0–100
  reasoning: string;
}

export interface AiAdapter {
  /** Identifier for audit metadata, e.g. "anthropic:claude-sonnet-4-6" or "disabled". */
  readonly id: string;
  /** False when no provider is configured; features must degrade gracefully. */
  readonly enabled: boolean;
  complete(options: CompleteOptions): Promise<string>;
  translate(options: TranslateOptions): Promise<string>;
  summarize(options: SummarizeOptions): Promise<string>;
  score(options: ScoreOptions): Promise<AiScore>;
}
