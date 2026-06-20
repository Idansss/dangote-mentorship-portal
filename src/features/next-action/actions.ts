'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/rbac';
import { getAiAdapter } from '@/lib/ai';
import { mapActionError, ok, type ActionResult } from '@/lib/actions/result';
import { checkRateLimit } from '@/lib/auth/rate-limit-shared';
import { getNextActionContext } from './data';
import {
  buildNextActionPrompt,
  fallbackNextAction,
  parseNextActionResponse,
  type NextAction,
} from './next-action';

// "What should I do next?" (experience-layer.md §1.3). Assembles the user's live
// candidates, asks the AI to choose and phrase ONE (grounded strictly in those
// candidates), and caches the result for 10 minutes to keep the button cheap.
// Degrades to the highest-priority candidate when AI is off or returns nothing
// usable. Read-only: it suggests, it never writes (no audit row needed).

const TTL_MS = 10 * 60 * 1000;
interface CacheEntry {
  at: number;
  value: NextAction;
}
// Per-instance advisory cache (mirrors the rate-limiter's default in-memory store).
const cache = new Map<string, CacheEntry>();

export async function getNextBestAction(): Promise<ActionResult<NextAction & { source: 'ai' | 'fallback' }>> {
  try {
    const user = await requireUser();
    const locale = await getLocale();
    const lang = locale === 'FR' ? 'FR' : 'EN';
    const t = await getTranslations('nextAction');
    const caughtUp = { message: t('allCaughtUp'), link: '/dashboard' };

    const key = `${user.id}:${lang}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return ok({ ...hit.value, source: 'ai' });
    }

    const { candidates } = await getNextActionContext(user);

    // Deterministic baseline — also what we return when AI is off/unusable.
    const baseline = fallbackNextAction(candidates, caughtUp);

    const adapter = getAiAdapter();
    if (!adapter.enabled || candidates.length === 0) {
      cache.set(key, { at: Date.now(), value: baseline });
      return ok({ ...baseline, source: 'fallback' });
    }
    // Throttle the AI endpoint per user (production-readiness-report.md M1);
    // degrade to the deterministic baseline rather than erroring this widget.
    if (!(await checkRateLimit(`ai:next-action:${user.id}`, 10, 60_000)).ok) {
      return ok({ ...baseline, source: 'fallback' });
    }

    let chosen: NextAction | null = null;
    try {
      const raw = await adapter.complete({
        system:
          'You are the next-action assistant for a corporate mentorship portal. You ' +
          'choose exactly one action from a provided list and never invent items or links.',
        prompt: buildNextActionPrompt(candidates, lang),
        temperature: 0.2,
        maxTokens: 200,
      });
      chosen = parseNextActionResponse(raw, candidates.map((c) => c.link));
    } catch (error) {
      console.error('[next-action] request failed', error);
    }

    const value = chosen ?? baseline;
    cache.set(key, { at: Date.now(), value });
    return ok({ ...value, source: chosen ? 'ai' : 'fallback' });
  } catch (error) {
    return mapActionError(error);
  }
}
