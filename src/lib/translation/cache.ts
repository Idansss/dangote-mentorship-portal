/**
 * Translation cache orchestration (CLAUDE.md §5, §9.7: "cache so the same
 * content is never re-translated"). The decision logic is pure and depends only
 * on injected callbacks, so it is unit-testable without a database or a live AI
 * provider. The server wiring in ./index.ts supplies prisma- and adapter-backed
 * implementations of these deps.
 */

import type { AiLanguage } from '@/lib/ai';

export interface TranslationRef {
  entityType: string;
  entityId: string;
  sourceLang: AiLanguage;
  targetLang: AiLanguage;
}

export interface CachedTranslation {
  sourceText: string;
  translatedText: string;
}

export interface TranslateDeps {
  /** True when an AI provider is configured; false ⇒ degrade gracefully. */
  aiEnabled: boolean;
  /** Look up a previously cached translation for this entity + language pair. */
  lookup: (ref: TranslationRef) => Promise<CachedTranslation | null>;
  /** Persist a freshly produced translation. */
  persist: (ref: TranslationRef, value: CachedTranslation) => Promise<void>;
  /** Call the AI provider. Returns '' when unavailable. */
  translate: (text: string, sourceLang: AiLanguage, targetLang: AiLanguage) => Promise<string>;
}

export type TranslationStatus =
  | 'same-language' // source and target are identical — nothing to do
  | 'empty' // source text is blank
  | 'cache-hit' // served from the cache, no AI call
  | 'translated' // freshly translated and cached
  | 'unavailable'; // AI disabled or returned nothing — original text returned

export interface TranslationOutcome {
  text: string;
  status: TranslationStatus;
}

/**
 * Returns the target-language text, translating + caching only on a genuine miss.
 * The cache is keyed by (entity, language pair); a stored entry is reused only
 * when its source text is unchanged, so editing the original invalidates the
 * stale translation. On any failure the original text is returned — translation
 * is always advisory and never blocks the user (CLAUDE.md §0 rule 5).
 */
export async function getOrCreateTranslation(
  ref: TranslationRef,
  sourceText: string,
  deps: TranslateDeps,
): Promise<TranslationOutcome> {
  if (ref.sourceLang === ref.targetLang) {
    return { text: sourceText, status: 'same-language' };
  }
  if (sourceText.trim().length === 0) {
    return { text: sourceText, status: 'empty' };
  }

  const cached = await deps.lookup(ref);
  if (cached && cached.sourceText === sourceText) {
    return { text: cached.translatedText, status: 'cache-hit' };
  }

  if (!deps.aiEnabled) {
    return { text: sourceText, status: 'unavailable' };
  }

  const translatedText = await deps.translate(sourceText, ref.sourceLang, ref.targetLang);
  if (!translatedText) {
    return { text: sourceText, status: 'unavailable' };
  }

  await deps.persist(ref, { sourceText, translatedText });
  return { text: translatedText, status: 'translated' };
}
