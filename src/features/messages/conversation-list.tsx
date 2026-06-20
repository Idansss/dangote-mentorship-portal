import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from './data';

// Presentational conversation list (server component). Links each conversation
// to its thread; highlights the active one; shows the unread count.
export function ConversationList({
  items,
  activeId,
  labels,
  className,
}: {
  items: ConversationSummary[];
  activeId: string | null;
  labels: { title: string; empty: string; emptyHint: string };
  className?: string;
}) {
  return (
    <aside className={cn('flex h-full flex-col overflow-hidden border-r border-border bg-surface', className)}>
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-display text-h3 font-semibold text-ink">{labels.title}</h2>
        <p className="mt-0.5 text-micro text-ink-3">{items.length} active conversations</p>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-body text-ink">{labels.empty}</p>
          <p className="mt-1 text-small text-ink-3">{labels.emptyHint}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-y-auto">
          {items.map((c) => {
            const active = c.id === activeId;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2',
                    active && 'border-l-2 border-green bg-green-soft/50',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-soft text-small font-semibold text-green-strong">
                    {(c.otherName ?? '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-small font-medium text-ink">{c.otherName ?? '—'}</span>
                      {c.unread > 0 && (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-green px-1.5 text-micro text-white">
                          {c.unread > 9 ? '9+' : c.unread}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-micro text-ink-3">{c.lastMessage ?? '—'}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
