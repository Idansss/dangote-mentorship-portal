import 'server-only';
import { prisma } from '@/lib/db/prisma';

// Server-side draft loader for RSC pages: fetch a user's saved draft so the form
// can pre-fill and show a "resume where you left off" banner (experience-layer.md
// §1.11). Returns the stored values object, or null when there is no draft.
export async function getDraft<T = Record<string, unknown>>(
  userId: string,
  formKey: string,
): Promise<T | null> {
  const draft = await prisma.formDraft.findUnique({
    where: { userId_formKey: { userId, formKey } },
    select: { data: true, deletedAt: true },
  });
  if (!draft || draft.deletedAt) return null;
  return draft.data as T;
}
