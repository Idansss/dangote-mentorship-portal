'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  archiveProgrammeForm,
  updateProgrammeForm,
  type ProgrammeFormState,
} from '@/features/programmes/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ProgrammeEditValues {
  id: string;
  name: string;
  description: string;
  status: string;
}

export function ProgrammeEditForm({
  programme,
  statuses,
}: {
  programme: ProgrammeEditValues;
  statuses: string[];
}) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const router = useRouter();
  const [state, action, pending] = useActionState<ProgrammeFormState, FormData>(
    updateProgrammeForm,
    null,
  );
  const [archiveState, archiveAction, archivePending] = useActionState<
    ProgrammeFormState,
    FormData
  >(archiveProgrammeForm, null);

  useEffect(() => {
    if (archiveState?.ok) router.replace('/admin/programmes');
  }, [archiveState, router]);

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4 rounded-lg border p-4">
        <input type="hidden" name="id" value={programme.id} />

        <div className="space-y-2">
          <Label htmlFor="name">{t('programmeName')}</Label>
          <Input id="name" name="name" required maxLength={160} defaultValue={programme.name} />
          {state && !state.ok && state.error.fieldErrors?.name ? (
            <p className="text-sm text-destructive">{state.error.fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Input
            id="description"
            name="description"
            maxLength={2000}
            defaultValue={programme.description}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('status')}</Label>
          <select
            id="status"
            name="status"
            required
            defaultValue={programme.status}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

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
        <input type="hidden" name="id" value={programme.id} />
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
