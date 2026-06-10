import { getTranslations } from 'next-intl/server';
import type { JourneyResult } from '@/features/journey/journey';
import { JourneyRailView, type RailNode } from './journey-rail-view';

// Journey Rail (§19 §5) — server wrapper. Translates the step/state labels from
// the computed JourneyResult (experience-layer.md §1.2) and hands a serializable
// node list to the client view that renders the rail + tooltips + fill
// animation. Drop-in replacement for the earlier JourneyTracker (same prop).
export async function JourneyRail({ result }: { result: JourneyResult }) {
  const t = await getTranslations('journey');

  const nodes: RailNode[] = result.steps.map((step) => ({
    key: step.key,
    label: t(`steps.${step.key}`),
    stateLabel: t(`states.${step.state}`),
    state: step.state,
    link: step.link,
    isCurrent: step.key === result.currentStepKey,
  }));

  return (
    <JourneyRailView
      title={t('title')}
      progressLabel={t('progress', { percent: result.progressPercent })}
      openLabel={t('open')}
      nodes={nodes}
    />
  );
}
