'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('inbox')} {unread > 0 ? <Badge variant="secondary">{t('unreadCount', { count: unread })}</Badge> : null}
        </h2>
        {unread > 0 ? (
          <Button type="button" size="sm" variant="outline" onClick={markAll} disabled={pending}>
            {t('markAllRead')}
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'rounded border p-3 text-sm',
                n.read ? 'bg-background' : 'border-primary/40 bg-primary/5',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{n.title}</p>
                  {n.body ? <p className="text-muted-foreground">{n.body}</p> : null}
                  <p className="text-xs text-muted-foreground">{n.createdAt.slice(0, 10)}</p>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => !n.read && markRead(n.id)}
                      className="text-xs font-medium text-primary hover:underline"
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
