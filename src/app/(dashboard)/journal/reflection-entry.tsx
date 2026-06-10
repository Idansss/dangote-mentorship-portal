'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  setReflectionShared,
  deleteReflectionEntry,
} from '@/features/reflections/actions';
import { TranslateToggle } from '@/components/translate-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Lang = 'EN' | 'FR';

export interface ReflectionEntryProps {
  entry: {
    id: string;
    title: string | null;
    body: string;
    bodyLang: Lang;
    isSharedWithMentor: boolean;
    sessionDate: string | null;
    authorName: string | null;
    createdAt: string;
  };
  viewer: 'owner' | 'mentor';
}

// One reflection entry. The owner (mentee) can share/unshare it with their mentor
// and delete it; a mentor sees only shared entries, read-only. Bodies get the
// shared translate toggle (experience-layer.md "bilingual everywhere").
export function ReflectionEntry({ entry, viewer }: ReflectionEntryProps) {
  const t = useTranslations('journal');
  const tc = useTranslations('common');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function refreshAfter(run: () => Promise<unknown>) {
    startTransition(async () => {
      await run();
      router.refresh();
    });
  }

  function toggleShare() {
    const fd = new FormData();
    fd.set('entryId', entry.id);
    fd.set('shared', entry.isSharedWithMentor ? 'false' : 'true');
    refreshAfter(() => setReflectionShared(fd));
  }

  function remove() {
    const fd = new FormData();
    fd.set('entryId', entry.id);
    refreshAfter(() => deleteReflectionEntry(fd));
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{entry.title || t('untitled')}</CardTitle>
          {entry.isSharedWithMentor ? (
            <Badge variant="secondary">{t('sharedBadge')}</Badge>
          ) : viewer === 'owner' ? (
            <Badge variant="outline">{t('privateBadge')}</Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {entry.createdAt.slice(0, 10)}
          {entry.sessionDate ? ` · ${t('fromSession')} ${entry.sessionDate}` : ''}
          {viewer === 'mentor' && entry.authorName ? ` · ${entry.authorName}` : ''}
        </p>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <TranslateToggle
          entityType="reflection_entry"
          entityId={entry.id}
          text={entry.body}
          sourceLang={entry.bodyLang}
        />

        {viewer === 'owner' ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button type="button" size="sm" variant="outline" onClick={toggleShare} disabled={pending}>
              {entry.isSharedWithMentor ? t('unshare') : t('share')}
            </Button>
            {confirming ? (
              <>
                <span className="text-xs text-muted-foreground">{t('confirmDelete')}</span>
                <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={pending}>
                  {tc('delete')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  {tc('cancel')}
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}>
                {tc('delete')}
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
