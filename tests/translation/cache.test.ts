import { describe, expect, it, vi } from 'vitest';
import {
  getOrCreateTranslation,
  type CachedTranslation,
  type TranslateDeps,
  type TranslationRef,
} from '@/lib/translation/cache';

const REF: TranslationRef = {
  entityType: 'ForumPost',
  entityId: 'post_1',
  sourceLang: 'EN',
  targetLang: 'FR',
};

function refKey(ref: TranslationRef): string {
  return `${ref.entityType}:${ref.entityId}:${ref.sourceLang}:${ref.targetLang}`;
}

/** In-memory deps mirroring the prisma-backed store, with a spy on translate. */
function makeDeps(opts?: { aiEnabled?: boolean }) {
  const store = new Map<string, CachedTranslation>();
  const translate = vi.fn(async (text: string) => `FR(${text})`);
  const deps: TranslateDeps = {
    aiEnabled: opts?.aiEnabled ?? true,
    lookup: async (ref) => store.get(refKey(ref)) ?? null,
    persist: async (ref, value) => {
      store.set(refKey(ref), value);
    },
    translate,
  };
  return { deps, translate, store };
}

describe('getOrCreateTranslation', () => {
  it('never re-translates the same content (cache hit on the second call)', async () => {
    const { deps, translate } = makeDeps();

    const first = await getOrCreateTranslation(REF, 'Hello team', deps);
    expect(first).toEqual({ text: 'FR(Hello team)', status: 'translated' });

    const second = await getOrCreateTranslation(REF, 'Hello team', deps);
    expect(second).toEqual({ text: 'FR(Hello team)', status: 'cache-hit' });

    // The golden assertion (CLAUDE.md §9.7): one AI call total, not two.
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when source and target language match', async () => {
    const { deps, translate } = makeDeps();
    const result = await getOrCreateTranslation(
      { ...REF, targetLang: 'EN' },
      'Hello',
      deps,
    );
    expect(result).toEqual({ text: 'Hello', status: 'same-language' });
    expect(translate).not.toHaveBeenCalled();
  });

  it('skips blank source text', async () => {
    const { deps, translate } = makeDeps();
    const result = await getOrCreateTranslation(REF, '   ', deps);
    expect(result.status).toBe('empty');
    expect(translate).not.toHaveBeenCalled();
  });

  it('returns the original text and does not call AI when the provider is disabled', async () => {
    const { deps, translate } = makeDeps({ aiEnabled: false });
    const result = await getOrCreateTranslation(REF, 'Hello team', deps);
    expect(result).toEqual({ text: 'Hello team', status: 'unavailable' });
    expect(translate).not.toHaveBeenCalled();
  });

  it('re-translates when the source text changed since it was cached', async () => {
    const { deps, translate } = makeDeps();

    await getOrCreateTranslation(REF, 'First version', deps);
    const edited = await getOrCreateTranslation(REF, 'Edited version', deps);

    expect(edited).toEqual({ text: 'FR(Edited version)', status: 'translated' });
    expect(translate).toHaveBeenCalledTimes(2);
  });

  it('returns the original text when the provider yields nothing', async () => {
    const { deps, translate } = makeDeps();
    translate.mockResolvedValueOnce('');
    const result = await getOrCreateTranslation(REF, 'Hello team', deps);
    expect(result).toEqual({ text: 'Hello team', status: 'unavailable' });
  });
});
