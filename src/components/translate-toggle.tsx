'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { translateText } from '@/features/translation/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Lang = 'EN' | 'FR';

// Reusable bilingual translate toggle (experience-layer.md "bilingual
// everywhere"): shows content in its original language with a one-tap toggle to
// an EN↔FR translation, cached server-side via the `translations` table. French
// users are never forced into English (CLAUDE.md §16) — translation is opt-in.
export function TranslateToggle({
  entityType,
  entityId,
  text,
  sourceLang,
  className,
}: {
  entityType: string;
  entityId: string;
  text: string;
  sourceLang: Lang;
  className?: string;
}) {
  const t = useTranslations('translate');
  const [pending, startTransition] = useTransition();
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState<'original' | 'translated'>('original');
  const [unavailable, setUnavailable] = useState(false);

  const targetLang: Lang = sourceLang === 'EN' ? 'FR' : 'EN';
  const toLabel = targetLang === 'EN' ? t('toEN') : t('toFR');

  function onToggle() {
    if (showing === 'translated') {
      setShowing('original');
      return;
    }
    if (translated !== null) {
      setShowing('translated');
      return;
    }
    setUnavailable(false);
    startTransition(async () => {
      const res = await translateText({ entityType, entityId, sourceText: text, sourceLang, targetLang });
      if (res.ok && res.data.status !== 'unavailable' && res.data.text) {
        setTranslated(res.data.text);
        setShowing('translated');
      } else {
        setUnavailable(true);
      }
    });
  }

  const body = showing === 'translated' && translated !== null ? translated : text;

  return (
    <div className={cn('space-y-1', className)}>
      <p className="whitespace-pre-wrap">{body}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onToggle}
          disabled={pending}
          aria-pressed={showing === 'translated'}
        >
          {pending
            ? t('translating')
            : showing === 'translated'
              ? t('viewOriginal')
              : toLabel}
        </Button>
        {unavailable ? (
          <span className="text-xs text-muted-foreground">{t('unavailable')}</span>
        ) : null}
      </div>
    </div>
  );
}
