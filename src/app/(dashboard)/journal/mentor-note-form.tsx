'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { saveMentorNoteForm, type ReflectionActionState } from '@/features/reflections/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Lang = 'EN' | 'FR';
const KINDS = ['observation', 'strength', 'growth', 'followup', 'idea'] as const;

// Mentor's private note about a mentee (experience-layer.md §1.16). Private to the
// mentor — never shown to the mentee or admins. The `kind` is optional free
// categorization so mentors aren't boxed in.
export function MentorNoteForm({ menteeId, defaultLang }: { menteeId: string; defaultLang: Lang }) {
  const t = useTranslations('journal');
  const tc = useTranslations('common');
  const router = useRouter();

  const [body, setBody] = useState('');
  const [state, action, pending] = useActionState<ReflectionActionState, FormData>(
    saveMentorNoteForm,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      setBody('');
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-2 rounded border bg-muted/20 p-3">
      <input type="hidden" name="menteeId" value={menteeId} />
      <Label htmlFor={`note-${menteeId}`}>{t('addNote')}</Label>
      <Textarea
        id={`note-${menteeId}`}
        name="body"
        required
        maxLength={8000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('notePlaceholder')}
      />
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`kind-${menteeId}`} className="text-xs">
            {t('noteKind')}
          </Label>
          <select
            id={`kind-${menteeId}`}
            name="kind"
            className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">{t('noteKindNone')}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`noteKinds.${k}`)}
              </option>
            ))}
          </select>
        </div>
        <select
          name="bodyLang"
          defaultValue={defaultLang}
          aria-label={t('writtenIn')}
          className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="EN">{tc('english')}</option>
          <option value="FR">{tc('french')}</option>
        </select>
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? tc('loading') : t('saveNote')}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'VALIDATION' ? tc('errorBody') : state.error.message}
        </p>
      ) : null}
    </form>
  );
}
