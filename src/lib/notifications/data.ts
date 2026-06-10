import 'server-only';
import type { Notification } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { DEFAULT_PREFS } from './types';

// Reads for the in-app notification centre (experience-layer.md §1.10).

export async function getUserNotifications(
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, deletedAt: null, readAt: null },
  });
}

export interface NotificationPrefsView {
  emailEnabled: boolean;
  digestEnabled: boolean;
  mutedTypes: string[];
}

export async function getPreferences(userId: string): Promise<NotificationPrefsView> {
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!pref) return { ...DEFAULT_PREFS, mutedTypes: [...DEFAULT_PREFS.mutedTypes] };
  return {
    emailEnabled: pref.emailEnabled,
    digestEnabled: pref.digestEnabled,
    mutedTypes: pref.mutedTypes,
  };
}
