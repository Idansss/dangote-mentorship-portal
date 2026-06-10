'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createInviteForm, type InviteFormState } from '@/features/invites/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CohortOption = { id: string; name: string };

export function InviteCreateForm({
  roles,
  cohorts,
}: {
  roles: string[];
  cohorts: CohortOption[];
}) {
  const t = useTranslations('invites');
  const tc = useTranslations('common');
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    createInviteForm,
    null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setCopied(false);
    }
  }, [state]);

  // The raw token exists only in this response — build the link client-side.
  const inviteUrl =
    state?.ok && typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${state.data.token}`
      : null;

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" required maxLength={254} />
        {state && !state.ok && state.error.fieldErrors?.email ? (
          <p className="text-sm text-destructive">{state.error.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roleName">{t('role')}</Label>
          <select
            id="roleName"
            name="roleName"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cohortId">{t('cohort')}</Label>
          <select
            id="cohortId"
            name="cohortId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t('noCohort')}</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {inviteUrl ? (
        <div className="space-y-2 rounded-md border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm font-medium">{t('created')}</p>
          <p className="break-all font-mono text-xs">{inviteUrl}</p>
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {copied ? t('copied') : t('copy')}
          </Button>
        </div>
      ) : null}
      {state && !state.ok && !state.error.fieldErrors ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'CONFLICT'
            ? t('conflict')
            : state.error.code === 'FORBIDDEN'
              ? t('adminOnly')
              : tc('errorBody')}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {t('create')}
      </Button>
    </form>
  );
}
