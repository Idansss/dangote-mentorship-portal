'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import {
  setMaintenanceModeForm,
  type MaintenanceFormState,
} from '@/features/settings/form-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MaintenanceToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const [state, action, pending] = useActionState<MaintenanceFormState, FormData>(
    setMaintenanceModeForm,
    null,
  );

  // The server result is the source of truth once it lands; before that, fall
  // back to the value the page was rendered with.
  const enabled = state?.ok ? state.data.enabled : initialEnabled;
  const [confirming, setConfirming] = useState(false);

  const next = !enabled;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{t('maintenanceStatus')}</span>
        <Badge variant={enabled ? 'destructive' : 'secondary'}>
          {enabled ? t('statusOn') : t('statusOff')}
        </Badge>
      </div>

      {enabled ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t('maintenanceActiveWarning')}</p>
        </div>
      ) : null}

      {/* Turning maintenance ON locks everyone but admins out, so it asks for an
          explicit confirm step. Turning it OFF is low-risk and submits directly. */}
      {confirming && next ? (
        <form action={action} className="space-y-3 rounded-md border bg-muted/30 p-3">
          <input type="hidden" name="enabled" value="true" />
          <p className="text-sm">{t('confirmEnable')}</p>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {t('confirmEnableButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              {tc('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <form action={action}>
          <input type="hidden" name="enabled" value={next ? 'true' : 'false'} />
          <Button
            type={next ? 'button' : 'submit'}
            variant={next ? 'destructive' : 'outline'}
            disabled={pending}
            onClick={next ? () => setConfirming(true) : undefined}
            className={cn(next && 'min-w-44')}
          >
            {next ? t('enableButton') : t('disableButton')}
          </Button>
        </form>
      )}

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{tc('errorBody')}</p>
      ) : null}
    </div>
  );
}
