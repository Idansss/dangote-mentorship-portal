import 'server-only';
import { createTranslator } from 'next-intl';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/mail';
import {
  selectEmailChannel,
  isMuted,
  DEFAULT_PREFS,
  type NotificationType,
} from './types';

// The notification emit seam (experience-layer.md §1.10). Features call notify()
// after a mutation; it renders the message in the *recipient's* language (not the
// actor's), writes the in-app row, and routes email immediately / to the digest /
// nowhere per the user's preferences. In-app is always immediate (the unread badge
// updates on next load); only email is batched. WhatsApp/SMS/Teams stay behind the
// existing feature flag (Tier 2) — this seam only does in-app + email.

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  // ICU params for the `notifications.types.<type>.title/body` messages.
  params?: Record<string, string | number>;
  link?: string;
  cohortId?: string | null;
}

type LocaleCode = 'en' | 'fr';

const messageCache: Partial<Record<LocaleCode, Record<string, unknown>>> = {};

async function loadMessages(locale: LocaleCode): Promise<Record<string, unknown>> {
  if (!messageCache[locale]) {
    messageCache[locale] = (await import(`../../../messages/${locale}.json`)).default;
  }
  return messageCache[locale]!;
}

function toLocaleCode(locale: string | null | undefined): LocaleCode {
  return (locale ?? '').toUpperCase() === 'FR' ? 'fr' : 'en';
}

/** Emit one notification to one user. Never throws — a notification failure must
 * not roll back the action that triggered it. */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const recipient = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, locale: true, notificationPreference: true },
    });
    if (!recipient) return;

    const prefs = recipient.notificationPreference ?? DEFAULT_PREFS;
    if (isMuted(input.type, prefs.mutedTypes)) return;

    const localeCode = toLocaleCode(recipient.locale);
    const messages = await loadMessages(localeCode);
    const t = createTranslator({
      locale: localeCode,
      messages,
      namespace: 'notifications.types',
    });
    const title = t(`${input.type}.title`, input.params);
    const body = t(`${input.type}.body`, input.params);

    const channel = selectEmailChannel(input.type, prefs);

    await prisma.notification.create({
      data: {
        userId: recipient.id,
        cohortId: input.cohortId ?? null,
        type: input.type,
        title,
        body,
        link: input.link ?? null,
        emailPending: channel === 'digest',
        emailedAt: channel === 'immediate' ? new Date() : null,
      },
    });

    if (channel === 'immediate' && recipient.email) {
      await sendEmail({ to: recipient.email, subject: title, text: body });
    }
  } catch (error) {
    // Swallow — notifications are best-effort (CLAUDE.md §14: no PII in logs).
    console.error('[notify] failed to emit notification', { type: input.type, error });
  }
}

/** Emit the same notification to many users (e.g. all admins). */
export async function notifyMany(
  userIds: string[],
  input: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  const unique = Array.from(new Set(userIds));
  await Promise.all(unique.map((userId) => notify({ ...input, userId })));
}
