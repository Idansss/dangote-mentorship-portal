import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/rbac';
import { ensureDirectConversations, listConversations } from '@/features/messages/data';
import { ConversationList } from '@/features/messages/conversation-list';

// Direct messages (CLAUDE.md §10). DMs are auto-provisioned for accepted pairs
// on load. This index shows the conversation list; selecting one opens its
// thread at /messages/[conversationId].
export default async function MessagesPage() {
  const user = await requireUser();
  const t = await getTranslations('messages');

  await ensureDirectConversations(user.id);
  const conversations = await listConversations(user.id);
  const firstConversation = conversations[0];
  if (firstConversation) redirect(`/messages/${firstConversation.id}`);

  return (
    <section className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <ConversationList
        items={conversations}
        activeId={null}
        labels={{ title: t('title'), empty: t('empty'), emptyHint: t('emptyHint') }}
      />
      <div className="hidden items-center justify-center rounded-2xl border border-border bg-surface text-body text-ink-3 lg:flex">
        {t('selectConversation')}
      </div>
    </section>
  );
}
