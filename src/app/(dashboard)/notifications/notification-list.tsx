'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notifications/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationList({ items, unread }: { items: Item[]; unread: number }) {
  const t = useTranslations('notifications');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markRead(id: string) {
    const fd = new FormData();
    fd.set('notificationId', id);
    startTransition(async () => {
      await markNotificationRead(fd);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elevation">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 font-display text-h3 font-semibold text-ink">
          {t('inbox')}
          {unread > 0 ? (
            <Badge variant="secondary">{t('unreadCount', { count: unread })}</Badge>
          ) : null}
        </h2>
        {unread > 0 ? (
          <Button type="button" size="sm" variant="outline" onClick={markAll} disabled={pending}>
            {t('markAllRead')}
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        /* Empty state — Atlas "all caught up" card */
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-green-soft text-green-strong">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <p className="mt-5 font-display text-h2 text-ink">{t('empty')}</p>
          <p className="mt-1 text-body text-ink-3">{t('emptyHint')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'px-5 py-4 text-small transition-colors',
                n.read ? 'bg-surface' : 'bg-green-soft/40',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 font-medium text-ink">
                    {!n.read ? (
                      <span aria-hidden className="size-2 shrink-0 rounded-full bg-green" />
                    ) : null}
                    {n.title}
                  </p>
                  {n.body ? <p className="text-ink-2">{n.body}</p> : null}
                  <p className="text-micro text-ink-3">{n.createdAt.slice(0, 10)}</p>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => !n.read && markRead(n.id)}
                      className="text-small font-medium text-green-strong hover:underline"
                    >
                      {t('open')}
                    </Link>
                  ) : null}
                </div>
                {!n.read ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => markRead(n.id)} disabled={pending}>
                    {t('markRead')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
