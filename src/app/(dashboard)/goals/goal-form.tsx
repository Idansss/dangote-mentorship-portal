'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { saveGoalForm, requestGoalCoach, type GoalActionState } from '@/features/goals/actions';
import type { CoachResult } from '@/features/goals/coach';
import type { GoalDraftFields, SmartDimension } from '@/features/goals/smart';
import { useFormDraft } from '@/components/use-form-draft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Values = Required<{ [K in keyof GoalDraftFields]: string }>;

const EMPTY: Values = {
  title: '',
  competency: '',
  whyMatters: '',
  currentLevel: '',
  desiredLevel: '',
  learningActivity: '',
  successMeasure: '',
  startDate: '',
  endDate: '',
};

// Mentee goal form (CLAUDE.md §7). Autosaves a draft so work is never lost
// (experience-layer.md §1.11), and offers the Goal Coach (§9.2) as an editable
// suggestion — the mentee always stays in control of what is saved.
export function GoalForm({
  mode,
  goalId,
  cohortId,
  initial,
  enableDraft = false,
}: {
  mode: 'create' | 'edit';
  goalId?: string;
  cohortId?: string;
  initial?: GoalDraftFields;
  enableDraft?: boolean;
}) {
  const t = useTranslations('goals');
  const tc = useTranslations('common');
  const td = useTranslations('drafts');
  const router = useRouter();

  const [values, setValues] = useState<Values>({ ...EMPTY, ...normalize(initial) });
  const [state, action, pending] = useActionState<GoalActionState, FormData>(saveGoalForm, null);

  const formKey = mode === 'edit' && goalId ? `goal:${goalId}` : 'goal:new';
  const { status: draftStatus, clear } = useFormDraft({
    formKey,
    values,
    cohortId,
    enabled: enableDraft,
  });

  const [coachPending, startCoach] = useTransition();
  const [coach, setCoach] = useState<CoachResult | null>(null);

  // On a successful save, clear the draft and refresh server data so the new or
  // updated goal appears in the list.
  useEffect(() => {
    if (state?.ok) {
      if (enableDraft) void clear();
      router.refresh();
      if (mode === 'create') setValues({ ...EMPTY });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function set<K extends keyof Values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function runCoach() {
    setCoach(null);
    startCoach(async () => {
      const res = await requestGoalCoach(values);
      if (res.ok) setCoach(res.data);
    });
  }

  function applySuggestion() {
    const s = coach?.suggestion;
    if (!s) return;
    setValues((v) => ({
      ...v,
      title: s.title || v.title,
      successMeasure: s.successMeasure || v.successMeasure,
      learningActivity: s.learningActivity || v.learningActivity,
    }));
  }

  return (
    <form action={action} className="space-y-4">
      {goalId ? <input type="hidden" name="goalId" value={goalId} /> : null}

      {enableDraft && draftStatus === 'saved' ? (
        <p className="text-xs text-muted-foreground">{td('saved')}</p>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor={`${formKey}-title`}>{t('titleField')}</Label>
        <Input
          id={`${formKey}-title`}
          name="title"
          required
          minLength={3}
          maxLength={200}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${formKey}-competency`} label={t('competency')} name="competency" value={values.competency} onChange={(v) => set('competency', v)} />
        <Field id={`${formKey}-endDate`} label={t('endDate')} name="endDate" type="date" value={values.endDate} onChange={(v) => set('endDate', v)} />
        <Field id={`${formKey}-currentLevel`} label={t('currentLevel')} name="currentLevel" value={values.currentLevel} onChange={(v) => set('currentLevel', v)} />
        <Field id={`${formKey}-desiredLevel`} label={t('desiredLevel')} name="desiredLevel" value={values.desiredLevel} onChange={(v) => set('desiredLevel', v)} />
        <Field id={`${formKey}-startDate`} label={t('startDate')} name="startDate" type="date" value={values.startDate} onChange={(v) => set('startDate', v)} />
      </div>

      <TextField id={`${formKey}-whyMatters`} label={t('whyMatters')} name="whyMatters" value={values.whyMatters} onChange={(v) => set('whyMatters', v)} />
      <TextField id={`${formKey}-learningActivity`} label={t('learningActivity')} name="learningActivity" value={values.learningActivity} onChange={(v) => set('learningActivity', v)} />
      <TextField id={`${formKey}-successMeasure`} label={t('successMeasure')} name="successMeasure" value={values.successMeasure} onChange={(v) => set('successMeasure', v)} />

      {/* Goal Coach — advisory; suggestion is editable before anything saves. */}
      <div className="rounded border bg-muted/30 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{t('coachTitle')}</p>
          <Button type="button" size="sm" variant="outline" onClick={runCoach} disabled={coachPending || !values.title.trim()}>
            {coachPending ? t('coaching') : t('askCoach')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('coachIntro')}</p>

        {coach ? (
          <div className="space-y-2 text-sm">
            <p>
              {t('smartScore')}: <span className="font-semibold">{coach.assessment.score}%</span>
            </p>
            {coach.assessment.missing.length > 0 ? (
              <p className="text-muted-foreground">
                {t('coachMissing')}:{' '}
                {coach.assessment.missing.map((d: SmartDimension) => t(`smart.${d}`)).join(', ')}
              </p>
            ) : null}

            {coach.suggestion ? (
              <div className="space-y-1 rounded border bg-background p-2">
                {coach.suggestion.rationale ? (
                  <p className="text-xs text-muted-foreground">{coach.suggestion.rationale}</p>
                ) : null}
                {coach.suggestion.title ? <p><strong>{t('titleField')}:</strong> {coach.suggestion.title}</p> : null}
                {coach.suggestion.successMeasure ? <p><strong>{t('successMeasure')}:</strong> {coach.suggestion.successMeasure}</p> : null}
                {coach.suggestion.learningActivity ? <p><strong>{t('learningActivity')}:</strong> {coach.suggestion.learningActivity}</p> : null}
                <Button type="button" size="sm" variant="secondary" onClick={applySuggestion}>
                  {t('applySuggestion')}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {coach.aiEnabled ? t('coachNoSuggestion') : t('coachUnavailable')}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">
          {state.error.code === 'VALIDATION' ? tc('errorBody') : state.error.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? tc('loading') : mode === 'create' ? t('createGoal') : t('save')}
      </Button>
    </form>
  );
}

function Field({
  id, label, name, value, onChange, type = 'text',
}: {
  id: string; label: string; name: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextField({
  id, label, name, value, onChange,
}: {
  id: string; label: string; name: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function normalize(initial?: GoalDraftFields): Partial<Values> {
  if (!initial) return {};
  const out: Partial<Values> = {};
  for (const [k, v] of Object.entries(initial)) {
    if (v != null) out[k as keyof Values] = String(v);
  }
  return out;
}
