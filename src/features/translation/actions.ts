'use server';

import { z } from 'zod';
import { Language } from '@prisma/client';
import { requireUser } from '@/lib/auth/rbac';
import { translateContent } from '@/lib/translation';
import { mapActionError, ok, type ActionResult } from '@/lib/actions/result';

// On-demand translate toggle for any bilingual content the user is viewing
// (experience-layer.md "bilingual everywhere"). Authenticated-only; the caller
// passes the source text they can already see, so this re-derives no access.
// The cache is keyed by (entity, language pair) and only served when the source
// text matches exactly, so a translation is always faithful to the submitted
// text — at worst a mismatched entityId costs an extra AI call, never a wrong
// answer.
const translateSchema = z.object({
  entityType: z.string().trim().min(1).max(64),
  entityId: z.string().trim().min(1).max(64),
  sourceText: z.string().max(20000),
  sourceLang: z.nativeEnum(Language),
  targetLang: z.nativeEnum(Language),
});

export type TranslateInput = z.infer<typeof translateSchema>;

export async function translateText(
  input: TranslateInput,
): Promise<ActionResult<{ text: string; status: string }>> {
  try {
    await requireUser();
    const data = translateSchema.parse(input);
    const result = await translateContent(data);
    return ok({ text: result.text, status: result.status });
  } catch (error) {
    return mapActionError(error);
  }
}
