'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MeetingType } from '@prisma/client';
import { scheduleMeetingForm, type MeetingActionState } from '@/features/meetings/actions';
import type { CounterpartOption } from '@/features/meetings/data';
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
import { Textarea } from '@/components/ui/textarea';

const MEETING_TYPES = Object.values(MeetingType);

export function ScheduleForm({ counterparts }: { counterparts: CounterpartOption[] }) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<MeetingActionState, FormData>(
    scheduleMeetingForm,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="mt-counterpart">{t('with')}</Label>
          <Select name="counterpartId" required defaultValue={counterparts[0]?.id}>
            <SelectTrigger id="mt-counterpart">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {counterparts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({t(`role.${c.role}`)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mt-type">{t('type')}</Label>
          <Select name="type" defaultValue={MeetingType.ZOOM}>
            <SelectTrigger id="mt-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_TYPES.map((mt) => (
                <SelectItem key={mt} value={mt}>
                  {t(`meetingType.${mt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="mt-title">{t('titleField')}</Label>
          <Input id="mt-title" name="title" required minLength={2} maxLength={200} placeholder={t('titlePlaceholder')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mt-start">{t('startsAt')}</Label>
          <Input id="mt-start" name="startsAt" type="datetime-local" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mt-end">{t('endsAt')}</Label>
          <Input id="mt-end" name="endsAt" type="datetime-local" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="mt-location">{t('location')}</Label>
          <Input id="mt-location" name="location" maxLength={200} placeholder={t('locationPlaceholder')} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="mt-desc">{t('description')}</Label>
          <Textarea id="mt-desc" name="description" maxLength={2000} />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'VALIDATION' || state.error.code === 'FORBIDDEN'
            ? state.error.message
            : tc('errorBody')}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || counterparts.length === 0}>
        {pending ? tc('loading') : t('schedule')}
      </Button>
    </form>
  );
}
