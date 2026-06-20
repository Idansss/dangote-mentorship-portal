import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Users, Target } from 'lucide-react';
import { requireUser } from '@/lib/auth/rbac';
import {
  ensureDirectConversations,
  listConversations,
  getThread,
  markConversationRead,
} from '@/features/messages/data';
import { ConversationList } from '@/features/messages/conversation-list';
import { MessageThread } from '@/features/messages/message-thread';

function initialsOf(name: string | null): string {
  const s = (name ?? '?').trim();
  const [a, b] = s.split(/\s+/).filter(Boolean);
  if (a && b) return (a.charAt(0) + b.charAt(0)).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

// A single conversation thread. getThread also authorizes participation (returns
// null for non-participants → 404), so admins/non-members cannot read content.
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await requireUser();
  const t = await getTranslations('messages');

  await ensureDirectConversations(user.id);
  const thread = await getThread(conversationId, user.id);
  if (!thread) notFound();

  // Mark read before listing so the open conversation shows 0 unread.
  await markConversationRead(conversationId, user.id);
  const conversations = await listConversations(user.id);

  return (
    <section className="grid gap-4 lg:grid-cols-[18rem_1fr] xl:grid-cols-[18rem_1fr_16rem]">
      <div className="hidden lg:block">
        <ConversationList
          items={conversations}
          activeId={conversationId}
          labels={{ title: t('title'), empty: t('empty'), emptyHint: t('emptyHint') }}
        />
      </div>
      <MessageThread
        conversationId={conversationId}
        otherName={thread.otherName}
        initialMessages={thread.messages}
        labels={{
          placeholder: t('placeholder'),
          send: t('send'),
          empty: t('threadEmpty'),
          back: t('back'),
        }}
      />

      {/* Context panel (Stitch messages 3rd column) — real data only: the other
          participant + a link into the shared pair workspace where their full
          profile, goals and agreements live. Attachments ("shared assets") are
          deferred, so that section is intentionally omitted. */}
      <aside className="hidden self-start rounded-2xl border border-border bg-surface p-5 text-center shadow-elevation xl:block">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-soft text-h2 font-bold text-green-strong">
          {initialsOf(thread.otherName)}
        </span>
        <p className="mt-3 font-bold text-ink">{thread.otherName ?? '—'}</p>
        <p className="text-small text-ink-2">{t('participantSubtitle')}</p>

        <div className="mt-5 space-y-2 text-left">
          <Link
            href="/pair"
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-small font-medium text-ink transition-colors hover:bg-surface-2"
          >
            <Users className="size-4 text-green-light" />
            {t('viewPair')}
          </Link>
          <Link
            href="/goals"
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-small font-medium text-ink transition-colors hover:bg-surface-2"
          >
            <Target className="size-4 text-green-light" />
            {t('viewGoals')}
          </Link>
        </div>
      </aside>
    </section>
  );
}
