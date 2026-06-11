import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/rbac';
import {
  ensureDirectConversations,
  listConversations,
  getThread,
  markConversationRead,
} from '@/features/messages/data';
import { ConversationList } from '@/features/messages/conversation-list';
import { MessageThread } from '@/features/messages/message-thread';

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
    <section className="grid gap-4 lg:grid-cols-[20rem_1fr]">
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
    </section>
  );
}
