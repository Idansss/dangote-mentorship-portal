'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createCohortForm, type CohortFormState } from '@/features/cohorts/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProgrammeOption = { id: string; name: string };

export function CohortCreateForm({ programmes }: { programmes: ProgrammeOption[] }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<CohortFormState, FormData>(createCohortForm, null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (programmes.length === 0) {
    return <p className="text-muted-foreground">{t('noProgrammes')}</p>;
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="programmeId">{t('programmes')}</Label>
        <select
          id="programmeId"
          name="programmeId"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t('cohortName')}</Label>
        <Input id="name" name="name" required maxLength={160} />
        {state && !state.ok && state.error.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.error.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('startDate')}</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('endDate')}</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('languages')}</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="languages" value="EN" defaultChecked />
            {tc('english')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="languages" value="FR" defaultChecked />
            {tc('french')}
          </label>
        </div>
        {state && !state.ok && state.error.fieldErrors?.languages ? (
          <p className="text-sm text-destructive">{state.error.fieldErrors.languages[0]}</p>
        ) : null}
      </fieldset>

      {state?.ok ? <p className="text-sm text-primary">{t('createdCohort')}</p> : null}
      {state && !state.ok && !state.error.fieldErrors ? (
        <p className="text-sm text-destructive">{tc('errorBody')}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {t('newCohort')}
      </Button>
    </form>
  );
}
