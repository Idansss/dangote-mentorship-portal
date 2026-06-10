import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { JourneyResult, JourneyState } from '@/features/journey/journey';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Persistent journey roadmap shown on dashboards (experience-layer.md §1.2).
// Mobile-first: a vertical list of steps with status colour + deep link, and an
// overall progress bar. States: green/amber/red/grey for completed/needs-action/
// overdue/pending.
const DOT: Record<JourneyState, string> = {
  completed: 'bg-green-600 border-green-600',
  needs_action: 'bg-amber-500 border-amber-500',
  overdue: 'bg-red-600 border-red-600',
  pending: 'bg-muted border-muted-foreground/30',
};

const LABEL_TONE: Record<JourneyState, string> = {
  completed: 'text-green-700',
  needs_action: 'text-amber-700',
  overdue: 'text-red-700',
  pending: 'text-muted-foreground',
};

export async function JourneyTracker({ result }: { result: JourneyResult }) {
  const t = await getTranslations('journey');

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {t('progress', { percent: result.progressPercent })}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={result.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('title')}
        >
          <div className="h-full bg-green-600 transition-all" style={{ width: `${result.progressPercent}%` }} />
        </div>
      </CardHeader>

      <CardContent>
        <ol className="space-y-1">
          {result.steps.map((step) => {
            const isCurrent = step.key === result.currentStepKey;
            const label = t(`steps.${step.key}`);
            const stateLabel = t(`states.${step.state}`);
            const inner = (
              <span
                className={cn(
                  'flex items-center justify-between gap-3 rounded-md px-2 py-2',
                  isCurrent && 'bg-accent',
                  step.link && 'hover:bg-accent',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn('h-3 w-3 shrink-0 rounded-full border', DOT[step.state])} aria-hidden />
                  <span className={cn('text-sm', step.state === 'pending' ? 'text-muted-foreground' : 'font-medium')}>
                    {label}
                  </span>
                </span>
                <span className={cn('text-xs', LABEL_TONE[step.state])}>{stateLabel}</span>
              </span>
            );

            return (
              <li key={step.key}>
                {step.link ? (
                  <Link href={step.link} aria-label={`${label} — ${stateLabel}`} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
