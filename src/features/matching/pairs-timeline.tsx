import { getTranslations } from 'next-intl/server';
import { MatchStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { PairsTimeline, TimelinePair } from './timeline';

type Lang = 'EN' | 'FR';

// Pairs-engagement timeline (admin matching, §12). Committed pairs as rows; a
// per-month session-activity heat track across the cohort window — a Renaizant-
// style "how is each pairing engaging over the programme" picture. Metadata only.
export async function PairsTimelineView({
  timeline,
  lang,
}: {
  timeline: PairsTimeline;
  lang: Lang;
}) {
  const t = await getTranslations('matching');
  const locale = lang === 'FR' ? 'fr-FR' : 'en-GB';
  const monthLabel = (d: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(d);
  const fullDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(d) : '—';

  if (timeline.pairs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">{t('timelineTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title={t('noCommitted')} description={t('noCommittedHint')} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-h3">{t('timelineTitle')}</CardTitle>
          <p className="text-small text-ink-3">{t('timelineHint')}</p>
        </div>
        <Legend label={t('engagementLegend')} less={t('legendLess')} more={t('legendMore')} />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Month axis */}
            <div className="flex items-end gap-2 pb-2">
              <div className="w-72 shrink-0" />
              <div className="flex flex-1 gap-1">
                {timeline.monthStarts.map((m, i) => (
                  <div
                    key={m.toISOString()}
                    className={cn(
                      'flex-1 text-center text-micro uppercase',
                      i === timeline.currentMonthIndex ? 'font-medium text-green-strong' : 'text-ink-3',
                    )}
                  >
                    {monthLabel(m)}
                  </div>
                ))}
              </div>
              <div className="w-24 shrink-0 text-right text-micro uppercase text-ink-3">
                {t('sessionsShort')}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {timeline.pairs.map((p) => (
                <PairRow
                  key={p.matchId}
                  pair={p}
                  currentMonthIndex={timeline.currentMonthIndex}
                  statusLabel={statusLabel(p.status, t)}
                  statusVariant={statusVariant(p.status)}
                  cellTitle={(count, month) => t('sessionsInMonth', { count, month: monthLabel(month) })}
                  monthStarts={timeline.monthStarts}
                  lastActiveLabel={t('lastActive')}
                  lastActiveValue={fullDate(p.lastSessionAt)}
                  noSessionsLabel={t('noSessionsYet')}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PairRow({
  pair,
  currentMonthIndex,
  statusLabel,
  statusVariant,
  cellTitle,
  monthStarts,
  lastActiveLabel,
  lastActiveValue,
  noSessionsLabel,
}: {
  pair: TimelinePair;
  currentMonthIndex: number | null;
  statusLabel: string;
  statusVariant: React.ComponentProps<typeof Badge>['variant'];
  cellTitle: (count: number, month: Date) => string;
  monthStarts: Date[];
  lastActiveLabel: string;
  lastActiveValue: string;
  noSessionsLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 py-3">
      {/* Pair identity */}
      <div className="flex w-72 shrink-0 items-center gap-2">
        <AvatarGroup className="shrink-0">
          <Avatar className="size-8">
            <AvatarFallback className="text-micro">{initials(pair.mentorName)}</AvatarFallback>
          </Avatar>
          <Avatar className="size-8">
            <AvatarFallback className="bg-surface-2 text-micro text-ink-2">
              {initials(pair.menteeName)}
            </AvatarFallback>
          </Avatar>
        </AvatarGroup>
        <div className="min-w-0">
          <p className="truncate text-small font-medium text-ink">{pair.mentorName ?? '—'}</p>
          <p className="truncate text-micro text-ink-3">{pair.menteeName ?? '—'}</p>
        </div>
        <Badge variant={statusVariant} className="ml-auto shrink-0">
          {statusLabel}
        </Badge>
      </div>

      {/* Heat track */}
      <div className="flex flex-1 gap-1">
        {pair.monthly.map((count, i) => (
          <div
            key={i}
            title={cellTitle(count, monthStarts[i]!)}
            className={cn(
              'h-7 flex-1 rounded-sm',
              heatClass(count),
              i === currentMonthIndex && 'ring-2 ring-green/40 ring-offset-1 ring-offset-card',
            )}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="w-24 shrink-0 text-right">
        <p className="text-body font-medium tabular-nums text-ink">{pair.totalSessions}</p>
        <p className="text-micro text-ink-3" title={`${lastActiveLabel}: ${lastActiveValue}`}>
          {pair.totalSessions > 0 ? lastActiveValue : noSessionsLabel}
        </p>
      </div>
    </div>
  );
}

function Legend({ label, less, more }: { label: string; less: string; more: string }) {
  return (
    <div className="flex items-center gap-2 text-micro uppercase text-ink-3">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <span className="sr-only">{less}</span>
        {[0, 1, 2, 3].map((n) => (
          <span key={n} className={cn('size-3 rounded-sm', heatClass(n))} aria-hidden />
        ))}
        <span className="sr-only">{more}</span>
      </span>
    </div>
  );
}

// Session-count → green intensity (fixed thresholds keep the scale stable across
// runs). Empty months stay a quiet surface so active months read at a glance.
function heatClass(count: number): string {
  if (count <= 0) return 'bg-surface-2';
  if (count === 1) return 'bg-green/30';
  if (count === 2) return 'bg-green/55';
  return 'bg-green';
}

function initials(name: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '—';
}

function statusVariant(status: MatchStatus): React.ComponentProps<typeof Badge>['variant'] {
  return status === MatchStatus.ACCEPTED ? 'ok' : 'neutral';
}

function statusLabel(status: MatchStatus, t: Awaited<ReturnType<typeof getTranslations>>): string {
  switch (status) {
    case MatchStatus.ACCEPTED:
      return t('statusAccepted');
    case MatchStatus.OVERRIDDEN:
      return t('statusOverridden');
    default:
      return t('statusApproved');
  }
}
