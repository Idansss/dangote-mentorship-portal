'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MeetingType } from '@prisma/client';
import { saveSessionLog, requestSessionAssistant } from '@/features/sessions/actions';
import type { SessionSummaryOutcome } from '@/features/sessions/summary';
import { useOfflineForm } from '@/components/use-offline-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Assignee = 'mentee' | 'mentor' | 'none';
interface ItemRow {
  task: string;
  assignee: Assignee;
  due: string;
}
interface Values {
  // Index signature lets this satisfy useOfflineForm's Record<string, unknown>
  // constraint while keeping each field's explicit type below.
  [key: string]: unknown;
  menteeId: string;
  roughNotes: string;
  date: string;
  time: string;
  meetingType: string;
  competencyDiscussed: string;
  goalDiscussed: string;
  discussionSummary: string;
  actionsAgreed: string;
  challenges: string;
  resourcesNeeded: string;
  nextActionPlan: string;
  timeline: string;
  nextMeetingDate: string;
  mentorNotes: string;
  aiSummary: string;
  actionItems: ItemRow[];
}

const MEETING_TYPES = Object.values(MeetingType);

export function SessionForm({ mentees }: { mentees: { id: string; name: string | null }[] }) {
  const t = useTranslations('sessions');
  const tc = useTranslations('common');
  const router = useRouter();

  const initial: Values = {
    menteeId: mentees[0]?.id ?? '',
    roughNotes: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    meetingType: '',
    competencyDiscussed: '',
    goalDiscussed: '',
    discussionSummary: '',
    actionsAgreed: '',
    challenges: '',
    resourcesNeeded: '',
    nextActionPlan: '',
    timeline: '',
    nextMeetingDate: '',
    mentorNotes: '',
    aiSummary: '',
    actionItems: [],
  };

  const form = useOfflineForm<Values>({
    storageKey: 'session-log:new',
    initial,
    onSubmit: async (v) => {
      const fd = new FormData();
      fd.set('menteeId', v.menteeId);
      fd.set('date', v.date);
      fd.set('time', v.time);
      if (v.meetingType) fd.set('meetingType', v.meetingType);
      fd.set('competencyDiscussed', v.competencyDiscussed);
      fd.set('goalDiscussed', v.goalDiscussed);
      fd.set('discussionSummary', v.discussionSummary);
      fd.set('actionsAgreed', v.actionsAgreed);
      fd.set('challenges', v.challenges);
      fd.set('resourcesNeeded', v.resourcesNeeded);
      fd.set('nextActionPlan', v.nextActionPlan);
      fd.set('timeline', v.timeline);
      fd.set('nextMeetingDate', v.nextMeetingDate);
      fd.set('mentorNotes', v.mentorNotes);
      fd.set('aiSummary', v.aiSummary);
      fd.set('actionItems', JSON.stringify(v.actionItems.filter((i) => i.task.trim())));
      const res = await saveSessionLog(fd);
      return { ok: res.ok };
    },
    onSuccess: () => {
      form.replace({ ...initial, menteeId: form.values.menteeId });
      router.refresh();
    },
  });

  const { values: v, update } = form;
  const [aiPending, startAi] = useTransition();
  const [ai, setAi] = useState<SessionSummaryOutcome | null>(null);

  function runAssistant() {
    if (!v.roughNotes.trim() || !v.menteeId) return;
    setAi(null);
    startAi(async () => {
      const res = await requestSessionAssistant({ menteeId: v.menteeId, notes: v.roughNotes });
      if (res.ok) {
        setAi(res.data);
        const r = res.data.result;
        if (r) {
          update({
            discussionSummary: r.summary || v.discussionSummary,
            aiSummary: r.summary || v.aiSummary,
            competencyDiscussed: r.competencyDiscussed || v.competencyDiscussed,
            challenges: r.challenges || v.challenges,
            nextActionPlan: r.nextSteps || v.nextActionPlan,
            timeline: r.timeline || v.timeline,
            actionItems: [
              ...v.actionItems,
              ...r.actionItems.map((a) => ({
                task: a.task,
                assignee: 'mentee' as Assignee,
                due: a.due && /^\d{4}-\d{2}-\d{2}/.test(a.due) ? a.due.slice(0, 10) : '',
              })),
            ],
          });
        }
      }
    });
  }

  function setItem(i: number, patch: Partial<ItemRow>) {
    update({ actionItems: v.actionItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  }
  function addItem() {
    update({ actionItems: [...v.actionItems, { task: '', assignee: 'mentee', due: '' }] });
  }
  function removeItem(i: number) {
    update({ actionItems: v.actionItems.filter((_, idx) => idx !== i) });
  }

  const statusText: Record<string, string> = {
    idle: '',
    savedLocally: t('savedLocally'),
    syncing: t('syncing'),
    synced: t('synced'),
    offline: t('offlineQueued'),
    error: tc('errorBody'),
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.submit();
      }}
      className="space-y-4"
    >
      {/* Mentee + meeting basics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="sf-mentee">{t('mentee')}</Label>
          <select
            id="sf-mentee"
            value={v.menteeId}
            onChange={(e) => update({ menteeId: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {mentees.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="sf-type">{t('meetingType')}</Label>
          <select
            id="sf-type"
            value={v.meetingType}
            onChange={(e) => update({ meetingType: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {MEETING_TYPES.map((mt) => (
              <option key={mt} value={mt}>
                {t(`type.${mt}`)}
              </option>
            ))}
          </select>
        </div>
        <FieldInput id="sf-date" label={t('date')} type="date" value={v.date} onChange={(val) => update({ date: val })} />
        <FieldInput id="sf-time" label={t('time')} value={v.time} onChange={(val) => update({ time: val })} />
      </div>

      {/* Rough notes → AI */}
      <div className="rounded border bg-muted/30 p-3 space-y-2">
        <Label htmlFor="sf-rough">{t('roughNotes')}</Label>
        <Textarea
          id="sf-rough"
          value={v.roughNotes}
          onChange={(e) => update({ roughNotes: e.target.value })}
          placeholder={t('roughNotesHint')}
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={runAssistant} disabled={aiPending || !v.roughNotes.trim()}>
            {aiPending ? t('summarizing') : t('summarize')}
          </Button>
          <span className="text-xs text-muted-foreground">{t('assistantHint')}</span>
        </div>
        {ai && !ai.result ? (
          <p className="text-xs text-muted-foreground">
            {ai.aiEnabled ? t('assistantNoResult') : t('assistantUnavailable')}
          </p>
        ) : null}
        {ai?.result?.riskFlag ? <p className="text-sm text-destructive">{t('riskFlagged')}</p> : null}
        {ai?.result?.suggestedAgenda ? (
          <p className="text-xs"><strong>{t('suggestedAgenda')}:</strong> {ai.result.suggestedAgenda}</p>
        ) : null}
      </div>

      {/* Structured fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput id="sf-comp" label={t('competencyDiscussed')} value={v.competencyDiscussed} onChange={(val) => update({ competencyDiscussed: val })} />
        <FieldInput id="sf-goal" label={t('goalDiscussed')} value={v.goalDiscussed} onChange={(val) => update({ goalDiscussed: val })} />
      </div>
      <FieldText id="sf-summary" label={t('discussionSummary')} value={v.discussionSummary} onChange={(val) => update({ discussionSummary: val })} />
      <FieldText id="sf-actions" label={t('actionsAgreed')} value={v.actionsAgreed} onChange={(val) => update({ actionsAgreed: val })} />
      <FieldText id="sf-challenges" label={t('challenges')} value={v.challenges} onChange={(val) => update({ challenges: val })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput id="sf-resources" label={t('resourcesNeeded')} value={v.resourcesNeeded} onChange={(val) => update({ resourcesNeeded: val })} />
        <FieldInput id="sf-timeline" label={t('timeline')} value={v.timeline} onChange={(val) => update({ timeline: val })} />
      </div>
      <FieldText id="sf-next" label={t('nextActionPlan')} value={v.nextActionPlan} onChange={(val) => update({ nextActionPlan: val })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput id="sf-nextdate" label={t('nextMeetingDate')} type="date" value={v.nextMeetingDate} onChange={(val) => update({ nextMeetingDate: val })} />
      </div>
      <FieldText id="sf-notes" label={t('mentorNotes')} value={v.mentorNotes} onChange={(val) => update({ mentorNotes: val })} />

      {/* Action items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('actionItems')}</Label>
          <Button type="button" size="sm" variant="ghost" onClick={addItem}>
            {t('addActionItem')}
          </Button>
        </div>
        {v.actionItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noActionItemsYet')}</p>
        ) : (
          <div className="space-y-2">
            {v.actionItems.map((item, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                <Input
                  value={item.task}
                  onChange={(e) => setItem(i, { task: e.target.value })}
                  placeholder={t('taskPlaceholder')}
                  aria-label={t('task')}
                />
                <select
                  value={item.assignee}
                  onChange={(e) => setItem(i, { assignee: e.target.value as Assignee })}
                  aria-label={t('owner')}
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="mentee">{t('owner_mentee')}</option>
                  <option value="mentor">{t('owner_mentor')}</option>
                  <option value="none">{t('owner_none')}</option>
                </select>
                <Input
                  type="date"
                  value={item.due}
                  onChange={(e) => setItem(i, { due: e.target.value })}
                  aria-label={t('dueDate')}
                  className="w-auto"
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i)} aria-label={tc('delete')}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={form.status === 'syncing' || !v.menteeId}>
          {form.status === 'syncing' ? tc('loading') : t('saveLog')}
        </Button>
        {!form.online ? <span className="text-xs text-amber-600">{t('offline')}</span> : null}
        {statusText[form.status] ? (
          <span className="text-xs text-muted-foreground">{statusText[form.status]}</span>
        ) : null}
      </div>
    </form>
  );
}

function FieldInput({
  id, label, value, onChange, type = 'text',
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldText({
  id, label, value, onChange,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
