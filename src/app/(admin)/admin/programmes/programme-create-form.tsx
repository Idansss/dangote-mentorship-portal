'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  createProgrammeForm,
  type ProgrammeFormState,
} from '@/features/programmes/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProgrammeCreateForm() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ProgrammeFormState, FormData>(
    createProgrammeForm,
    null,
  );

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('programmeName')}</Label>
        <Input id="name" name="name" required maxLength={160} />
        {state && !state.ok && state.error.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.error.fieldErrors.name[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t('description')}</Label>
        <Input id="description" name="description" maxLength={2000} />
      </div>

      {state?.ok ? <p className="text-sm text-primary">{t('createdProgramme')}</p> : null}
      {state && !state.ok && !state.error.fieldErrors ? (
        <p className="text-sm text-destructive">{tc('errorBody')}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {t('newProgramme')}
      </Button>
    </form>
  );
}
