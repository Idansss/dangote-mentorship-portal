import { getTranslations } from 'next-intl/server';
import { Lightbulb } from 'lucide-react';

// Weekly tip (experience-layer.md §1.1 / Stitch redesign). Rotates through a small
// bilingual set by ISO week so it changes without any storage. Styled as the
// Stitch "Weekly Tip" recognition card — warm tertiary (gold/brown) surface with
// a lightbulb, the one warm accent in the otherwise teal system.
const TIP_COUNT = 4;

function weekIndex(date: Date, count: number): number {
  const days = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  return Math.floor(days / 7) % count;
}

export async function WeeklyTip({ className }: { className?: string }) {
  const t = await getTranslations('dashboardCards');
  const i = weekIndex(new Date(), TIP_COUNT) + 1;
  return (
    <div
      className={
        'flex h-full flex-col rounded-lg bg-gold p-6 text-white shadow-elevation ' +
        (className ?? '')
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="size-5" aria-hidden />
        <h3 className="text-micro font-bold uppercase tracking-widest">{t('weeklyTip')}</h3>
      </div>
      <p className="text-body leading-relaxed text-white/95">{t(`tips.tip${i}`)}</p>
    </div>
  );
}
