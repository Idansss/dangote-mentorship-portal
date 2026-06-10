'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  archiveCohortForm,
  updateCohortForm,
  type CohortFormState,
} from '@/features/cohorts/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProgrammeOption = { id: string; name: string };

export interface CohortEditValues {
  id: string;
  programmeId: string;
  name: string;
  description: string;
  startDate: string; // yyyy-mm-dd or ''
  endDate: string;
  languages: string[];
  status: string;
}

export function CohortEditForm({
  cohort,
  programmes,
  statuses,
}: {
  cohort: CohortEditValues;
  programmes: ProgrammeOption[];
  statuses: string[];
}) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const router = useRouter();
  const [state, action, pending] = useActionState<CohortFormState, FormData>(updateCohortForm, null);
  const [archiveState, archiveAction, archivePending] = useActionState<CohortFormState, FormData>(
    archiveCohortForm,
    null,
  );

  useEffect(() => {
    if (archiveState?.ok) router.replace('/admin/cohorts');
  }, [archiveState, router]);

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4 rounded-lg border p-4">
        <input type="hidden" name="id" value={cohort.id} />

        <div className="space-y-2">
          <Label htmlFor="programmeId">{t('programmes')}</Label>
          <select
            id="programmeId"
            name="programmeId"
            required
            defaultValue={cohort.programmeId}
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
          <Input id="name" name="name" required maxLength={160} defaultValue={cohort.name} />
          {state && !state.ok && state.error.fieldErrors?.name ? (
            <p className="text-sm text-destructive">{state.error.fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Input id="description" name="description" maxLength={2000} defaultValue={cohort.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('startDate')}</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={cohort.startDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('endDate')}</Label>
            <Input id="endDate" name="endDate" type="date" defaultValue={cohort.endDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{t('status')}</Label>
            <select
              id="status"
              name="status"
              required
              defaultValue={cohort.status}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('languages')}</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="languages"
                value="EN"
                defaultChecked={cohort.languages.includes('EN')}
              />
              {tc('english')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="languages"
                value="FR"
                defaultChecked={cohort.languages.includes('FR')}
              />
              {tc('french')}
            </label>
          </div>
          {state && !state.ok && state.error.fieldErrors?.languages ? (
            <p className="text-sm text-destructive">{state.error.fieldErrors.languages[0]}</p>
          ) : null}
        </fieldset>

        {state?.ok ? <p className="text-sm text-primary">{t('updated')}</p> : null}
        {state && !state.ok && !state.error.fieldErrors ? (
          <p className="text-sm text-destructive">{tc('errorBody')}</p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {tc('save')}
        </Button>
      </form>

      <form
        action={archiveAction}
        onSubmit={(e) => {
          if (!window.confirm(t('confirmArchive'))) e.preventDefault();
        }}
        className="rounded-lg border border-destructive/40 p-4"
      >
        <input type="hidden" name="id" value={cohort.id} />
        {archiveState && !archiveState.ok ? (
          <p className="mb-2 text-sm text-destructive">{tc('errorBody')}</p>
        ) : null}
        <Button type="submit" variant="destructive" disabled={archivePending}>
          {tc('archive')}
        </Button>
      </form>
    </div>
  );
}
