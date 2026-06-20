import 'server-only';
import { createTranslator } from 'next-intl';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/mail';
import type enMessages from '../../../messages/en.json';

// Daily digest sender (experience-layer.md §1.10 batching). Collects every
// notification still owed an email (`emailPending`), groups by recipient, sends a
// single localized digest, and clears the pending flag. Intended to be invoked by
// a scheduled job (wired in M5 / via cron); exposed here so it can be triggered
// and tested independently. In-app delivery already happened at emit time.

type LocaleCode = 'en' | 'fr';
// Typed so next-intl 4 can resolve translator keys (see notify.ts).
type Messages = typeof enMessages;
const messageCache: Partial<Record<LocaleCode, Messages>> = {};

async function loadMessages(locale: LocaleCode): Promise<Messages> {
  if (!messageCache[locale]) {
    messageCache[locale] = (await import(`../../../messages/${locale}.json`)).default;
  }
  return messageCache[locale]!;
}

function toLocaleCode(locale: string | null | undefined): LocaleCode {
  return (locale ?? '').toUpperCase() === 'FR' ? 'fr' : 'en';
}

export interface DigestResult {
  usersEmailed: number;
  notificationsSent: number;
}

export async function sendDailyDigests(): Promise<DigestResult> {
  const pending = await prisma.notification.findMany({
    where: { emailPending: true, emailedAt: null, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, email: true, locale: true } } },
  });
  if (pending.length === 0) return { usersEmailed: 0, notificationsSent: 0 };

  // Group by recipient.
  const byUser = new Map<string, typeof pending>();
  for (const n of pending) {
    const list = byUser.get(n.userId) ?? [];
    list.push(n);
    byUser.set(n.userId, list);
  }

  let usersEmailed = 0;
  let notificationsSent = 0;

  for (const [, items] of byUser) {
    const recipient = items[0]!.user;
    const localeCode = toLocaleCode(recipient.locale);
    const messages = await loadMessages(localeCode);
    const t = createTranslator({ locale: localeCode, messages, namespace: 'notifications.digest' });

    const lines = items.map((n) => `• ${n.title}${n.body ? ` — ${n.body}` : ''}`);
    const text = `${t('intro', { count: items.length })}\n\n${lines.join('\n')}`;

    if (recipient.email) {
      await sendEmail({ to: recipient.email, subject: t('subject', { count: items.length }), text });
      usersEmailed += 1;
    }

    await prisma.notification.updateMany({
      where: { id: { in: items.map((n) => n.id) } },
      data: { emailPending: false, emailedAt: new Date() },
    });
    notificationsSent += items.length;
  }

  return { usersEmailed, notificationsSent };
}
