'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { uploadImport } from '@/features/imports/actions';
import type { ActionResult } from '@/lib/actions/result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UploadState = ActionResult<{ id: string }> | null;

async function uploadAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  // On success uploadImport redirects to the review screen and never returns.
  return uploadImport(formData);
}

type CohortOption = { id: string; name: string };

export function UploadForm({ cohorts }: { cohorts: CohortOption[] }) {
  const t = useTranslations('imports');
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadAction, null);

  return (
    <form action={action} className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">{t('upload')}</h2>
      <p className="text-sm text-muted-foreground">{t('uploadHint')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cohortId">{t('cohort')}</Label>
          <Select name="cohortId" required defaultValue={cohorts[0]?.id}>
            <SelectTrigger id="cohortId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetRole">{t('targetRole')}</Label>
          <Select name="targetRole" required defaultValue="MENTOR">
            <SelectTrigger id="targetRole">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MENTOR">{t('mentors')}</SelectItem>
              <SelectItem value="MENTEE">{t('mentees')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">{t('file')}</Label>
        <Input id="file" name="file" type="file" accept=".csv,.xlsx,.xls,.xlsm" required />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {t('submit')}
      </Button>
    </form>
  );
}
