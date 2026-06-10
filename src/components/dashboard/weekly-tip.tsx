import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// A quiet weekly tip on the mentee dashboard (experience-layer.md §1.1). Rotates
// through a small bilingual set by ISO week so it changes without any storage.
const TIP_COUNT = 4;

function weekIndex(date: Date, count: number): number {
  const days = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  return Math.floor(days / 7) % count;
}

export async function WeeklyTip() {
  const t = await getTranslations('dashboardCards');
  const i = weekIndex(new Date(), TIP_COUNT) + 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-h3">{t('weeklyTip')}</CardTitle>
      </CardHeader>
      <CardContent className="text-small text-ink-2">{t(`tips.tip${i}`)}</CardContent>
    </Card>
  );
}
