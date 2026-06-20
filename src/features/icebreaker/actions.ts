'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/rbac';
import { writeAuditLog } from '@/lib/audit/audit';
import { getAiAdapter } from '@/lib/ai';
import { mapActionError, ok, fail, type ActionResult } from '@/lib/actions/result';
import { checkRateLimit } from '@/lib/auth/rate-limit-shared';
import { getIcebreaker } from './data';
import { buildIcebreakerPrompt, parseIcebreakerResponse, type IcebreakerResult } from './icebreaker';

// Generate (or regenerate) the first-session icebreaker for a pair and cache it on
// the Match row (experience-layer.md §1.17). Participant-only. Advisory: the guide
// is cached for reuse, never committed elsewhere. Degrades to the profile-built
// fallback when AI is off — the action reports aiEnabled:false and caches nothing.

const schema = z.object({ menteeId: z.string().cuid() });

export async function generateIcebreaker(
  formData: FormData,
): Promise<ActionResult<{ aiEnabled: boolean; cached: boolean }>> {
  try {
    const user = await requireUser();
    const { menteeId } = schema.parse({ menteeId: formData.get('menteeId') });

    const view = await getIcebreaker(user.id, menteeId);
    if (!view) {
      return fail({ code: 'NOT_FOUND', message: 'No accepted pairing found.' });
    }

    const adapter = getAiAdapter();
    if (!adapter.enabled) {
      return ok({ aiEnabled: false, cached: false });
    }
    // Throttle the AI endpoint per user (production-readiness-report.md M1).
    if (!(await checkRateLimit(`ai:icebreaker:${user.id}`, 10, 60_000)).ok) {
      return fail({ code: 'CONFLICT', message: 'Too many AI requests. Please wait a moment.' });
    }

    const lang = user.locale === 'FR' ? 'FR' : 'EN';
    let result: IcebreakerResult | null = null;
    try {
      const raw = await adapter.complete({
        system:
          'You are the First-Session Icebreaker Assistant for a corporate mentorship ' +
          'programme. You only suggest; you never invent facts not in the profiles.',
        prompt: buildIcebreakerPrompt(view.context, lang),
        temperature: 0.4,
        maxTokens: 700,
      });
      result = parseIcebreakerResponse(raw);
    } catch (error) {
      console.error('[icebreaker] request failed', error);
    }

    if (!result) {
      // AI returned nothing usable — leave any prior cache untouched.
      return ok({ aiEnabled: true, cached: false });
    }

    await prisma.match.update({
      where: { id: view.match.id },
      data: { icebreakerJson: result as unknown as object, icebreakerGeneratedAt: new Date() },
    });
    await writeAuditLog({
      actorId: user.id,
      cohortId: view.match.cohortId,
      action: 'icebreaker.generated',
      entityType: 'Match',
      entityId: view.match.id,
      metadata: { adapter: adapter.id },
    });

    revalidatePath(`/pair/${menteeId}`);
    return ok({ aiEnabled: true, cached: true });
  } catch (error) {
    return mapActionError(error);
  }
}

export async function generateIcebreakerAction(formData: FormData): Promise<void> {
  await generateIcebreaker(formData);
}
