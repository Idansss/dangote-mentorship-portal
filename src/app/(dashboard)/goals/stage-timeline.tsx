import { GoalStage } from '@prisma/client';
import { GOAL_STAGE_ORDER, stageIndex, stageProgressPercent } from '@/features/goals/stage';
import { cn } from '@/lib/utils';

// Presentational stage timeline + progress bar (experience-layer.md §1.7).
// Server-renderable: labels are passed in already localized by the page.
export function StageTimeline({
  stage,
  labels,
}: {
  stage: GoalStage;
  labels: Record<GoalStage, string>;
}) {
  const current = stageIndex(stage);
  const percent = stageProgressPercent(stage);

  return (
    <div className="space-y-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {GOAL_STAGE_ORDER.map((s, i) => (
          <li
            key={s}
            className={cn(
              'flex items-center gap-1',
              i < current && 'text-muted-foreground',
              i === current && 'font-semibold text-primary',
              i > current && 'text-muted-foreground/60',
            )}
            aria-current={i === current ? 'step' : undefined}
          >
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                i <= current ? 'bg-primary' : 'bg-muted-foreground/40',
              )}
            />
            {labels[s]}
          </li>
        ))}
      </ol>
    </div>
  );
}
