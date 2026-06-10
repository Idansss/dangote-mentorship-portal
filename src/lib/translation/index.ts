import 'server-only';
import { Language } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getAiAdapter } from '@/lib/ai';
import {
  getOrCreateTranslation,
  type TranslateDeps,
  type TranslationOutcome,
  type TranslationRef,
} from './cache';

export type { TranslationOutcome, TranslationStatus } from './cache';

export interface TranslateContentInput {
  /** Entity family, e.g. "ForumPost", "ReflectionJournalEntry", "Message". */
  entityType: string;
  entityId: string;
  sourceText: string;
  sourceLang: Language;
  targetLang: Language;
  /** Optional cohort for scoped retention/audit of the cache row. */
  cohortId?: string | null;
}

/**
 * Translate persisted content EN↔FR, caching the result in the `translations`
 * table (CLAUDE.md §9.7). The first real consumer of the AI adapter — when no
 * provider is configured the adapter is disabled and the original text is
 * returned unchanged.
 */
export async function translateContent(
  input: TranslateContentInput,
): Promise<TranslationOutcome> {
  const adapter = getAiAdapter();

  const ref: TranslationRef = {
    entityType: input.entityType,
    entityId: input.entityId,
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
  };

  const key = (r: TranslationRef) => ({
    entityType_entityId_sourceLang_targetLang: {
      entityType: r.entityType,
      entityId: r.entityId,
      sourceLang: r.sourceLang as Language,
      targetLang: r.targetLang as Language,
    },
  });

  const deps: TranslateDeps = {
    aiEnabled: adapter.enabled,
    lookup: async (r) =>
      prisma.translation.findUnique({
        where: key(r),
        select: { sourceText: true, translatedText: true },
      }),
    persist: async (r, value) => {
      await prisma.translation.upsert({
        where: key(r),
        update: {
          sourceText: value.sourceText,
          translatedText: value.translatedText,
          model: adapter.id,
          cohortId: input.cohortId ?? null,
        },
        create: {
          entityType: r.entityType,
          entityId: r.entityId,
          sourceLang: r.sourceLang as Language,
          targetLang: r.targetLang as Language,
          sourceText: value.sourceText,
          translatedText: value.translatedText,
          model: adapter.id,
          cohortId: input.cohortId ?? null,
        },
      });
    },
    translate: (text, sourceLang, targetLang) =>
      adapter.translate({ text, sourceLang, targetLang }),
  };

  return getOrCreateTranslation(ref, input.sourceText, deps);
}
