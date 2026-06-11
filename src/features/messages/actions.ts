'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Language } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/rbac';
import { ok, fail, mapActionError, type ActionResult } from '@/lib/actions/result';

// Send a direct message (CLAUDE.md §10). Authorizes that the sender is a
// participant of the conversation; content stays private to participants.
// Message body is stored with the sender's language; translation is deferred.

const sendSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().trim().min(1).max(4000),
});

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const { conversationId, body } = sendSchema.parse(input);

    // Authorization: only a participant may post.
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!participant) {
      return fail({ code: 'FORBIDDEN', message: 'You are not part of this conversation.' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        bodyOriginal: body,
        bodyLang: user.locale === 'FR' ? Language.FR : Language.EN,
      },
      select: { id: true },
    });

    // Touch the conversation so it sorts to the top of the list.
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    revalidatePath('/messages');
    revalidatePath(`/messages/${conversationId}`);
    return ok({ id: message.id });
  } catch (error) {
    return mapActionError(error);
  }
}
