'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deleteMentorNote } from '@/features/reflections/actions';
import { TranslateToggle } from '@/components/translate-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Lang = 'EN' | 'FR';

const KIND_KEYS = new Set(['observation', 'strength', 'growth', 'followup', 'idea']);

// One mentor private note: body with a translate toggle, an optional kind badge,
// and an owner-only delete (soft, confirm-first).
export function MentorNoteCard({
  note,
}: {
  note: { id: string; kind: string | null; body: string; bodyLang: Lang; createdAt: string };
}) {
  const t = useTranslations('journal');
  const tc = useTranslations('common');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function remove() {
    const fd = new FormData();
    fd.set('noteId', note.id);
    startTransition(async () => {
      await deleteMentorNote(fd);
      router.refresh();
    });
  }

  const kindLabel = note.kind
    ? KIND_KEYS.has(note.kind)
      ? t(`noteKinds.${note.kind}`)
      : note.kind
    : null;

  return (
    <div className="space-y-2 rounded border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {kindLabel ? <Badge variant="secondary">{kindLabel}</Badge> : null}
          <span className="text-xs text-muted-foreground">{note.createdAt.slice(0, 10)}</span>
        </div>
        {confirming ? (
          <span className="flex items-center gap-2">
            <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={pending}>
              {tc('delete')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              {tc('cancel')}
            </Button>
          </span>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            {tc('delete')}
          </Button>
        )}
      </div>
      <TranslateToggle
        entityType="mentor_note"
        entityId={note.id}
        text={note.body}
        sourceLang={note.bodyLang}
      />
    </div>
  );
}
