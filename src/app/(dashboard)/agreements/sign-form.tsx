'use client';

import { useActionState, useId } from 'react';
import { useTranslations } from 'next-intl';
import type { AgreementType } from '@prisma/client';
import { signAgreementForm, type SignAgreementState } from '@/features/agreements/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// E-sign form: a typed-name signature + an explicit consent checkbox. The
// consent text is the agreement's own wording, passed in already localized to
// the signer's language (CLAUDE.md §16) so there is one source of truth.
export function SignAgreementForm({
  cohortId,
  type,
  consentText,
}: {
  cohortId: string;
  type: AgreementType;
  consentText: string;
}) {
  const t = useTranslations('agreements');
  const tc = useTranslations('common');
  const nameId = useId();
  const consentId = useId();
  const [state, action, pending] = useActionState<SignAgreementState, FormData>(
    signAgreementForm,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="cohortId" value={cohortId} />
      <input type="hidden" name="type" value={type} />

      <div className="space-y-1">
        <Label htmlFor={nameId}>{t('typedNameLabel')}</Label>
        <Input id={nameId} name="typedName" required minLength={2} maxLength={120} autoComplete="name" />
      </div>

      <div className="flex items-start gap-2">
        <input
          id={consentId}
          name="consent"
          type="checkbox"
          required
          value="on"
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <Label htmlFor={consentId} className="text-sm font-normal leading-snug">
          {consentText}
        </Label>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'CONFLICT'
            ? t('conflict')
            : state.error.code === 'FORBIDDEN'
              ? t('forbidden')
              : tc('errorBody')}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? t('signing') : t('sign')}
      </Button>
    </form>
  );
}
