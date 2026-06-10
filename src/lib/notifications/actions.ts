'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/rbac';
import { mapActionError, ok, fail, type ActionResult } from '@/lib/actions/result';
import { NOTIFICATION_TYPES } from './types';

// In-app notification controls (experience-layer.md §1.10). Marking read is
// transient state (not audited); preferences are a per-user setting.

const markSchema = z.object({ notificationId: z.string().cuid() });

export async function markNotificationRead(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const { notificationId } = markSchema.parse({ notificationId: formData.get('notificationId') });

    const n = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!n || n.deletedAt || n.userId !== user.id) {
      return fail({ code: 'NOT_FOUND', message: 'Notification not found.' });
    }
    if (!n.readAt) {
      await prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
    }
    revalidatePath('/notifications');
    return ok({ id: notificationId });
  } catch (error) {
    return mapActionError(error);
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireUser();
    const res = await prisma.notification.updateMany({
      where: { userId: user.id, deletedAt: null, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath('/notifications');
    return ok({ count: res.count });
  } catch (error) {
    return mapActionError(error);
  }
}

const prefsSchema = z.object({
  emailEnabled: z.coerce.boolean(),
  digestEnabled: z.coerce.boolean(),
  mutedTypes: z.array(z.enum(NOTIFICATION_TYPES)).default([]),
});

export async function saveNotificationPreferences(
  formData: FormData,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireUser();
    // Checkboxes: present when on. Muted types arrive as repeated `muted` fields.
    const data = prefsSchema.parse({
      emailEnabled: formData.get('emailEnabled') === 'on' || formData.get('emailEnabled') === 'true',
      digestEnabled: formData.get('digestEnabled') === 'on' || formData.get('digestEnabled') === 'true',
      mutedTypes: formData.getAll('muted').map(String),
    });

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        emailEnabled: data.emailEnabled,
        digestEnabled: data.digestEnabled,
        mutedTypes: data.mutedTypes,
      },
      update: {
        emailEnabled: data.emailEnabled,
        digestEnabled: data.digestEnabled,
        mutedTypes: data.mutedTypes,
      },
    });
    revalidatePath('/notifications');
    return ok({ ok: true });
  } catch (error) {
    return mapActionError(error);
  }
}

// ── useActionState wrappers ─────────────────────────────────────────────────

export type NotificationActionState = ActionResult<unknown> | null;

export async function markAllNotificationsReadAction(formData: FormData): Promise<void> {
  void formData;
  await markAllNotificationsRead();
}
export async function markNotificationReadAction(formData: FormData): Promise<void> {
  await markNotificationRead(formData);
}
export async function saveNotificationPreferencesForm(
  _prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  return saveNotificationPreferences(formData);
}
