import { getLocale, getTranslations } from 'next-intl/server';
import { getAiAdapter } from '@/lib/ai';
import { getIcebreaker } from '@/features/icebreaker/data';
import { fallbackIcebreaker, type IcebreakerResult } from '@/features/icebreaker/icebreaker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IcebreakerButton } from './icebreaker-button';

// First-session icebreaker (experience-layer.md §1.17), generated from both
// profiles. Always shows a guide: the AI version when generated/cached, otherwise
// the profile-built fallback. Rendered on the Pair Contract Page and on the first
// meeting's Prepare view.
export async function IcebreakerCard({ viewerId, menteeId }: { viewerId: string; menteeId: string }) {
  const view = await getIcebreaker(viewerId, menteeId);
  if (!view) return null;

  const t = await getTranslations('icebreaker');
  const lang = (await getLocale()) === 'FR' ? 'FR' : 'EN';
  const aiEnabled = getAiAdapter().enabled;
  const usingFallback = view.cached === null;
  const guide: IcebreakerResult = view.cached ?? fallbackIcebreaker(view.context, lang);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <div className="flex items-center gap-2">
            {usingFallback ? (
              <Badge variant="outline">{t('fallbackBadge')}</Badge>
            ) : (
              <Badge variant="secondary">
                {t('cachedBadge')}
                {view.generatedAt ? ` · ${view.generatedAt.toISOString().slice(0, 10)}` : ''}
              </Badge>
            )}
            <IcebreakerButton menteeId={menteeId} hasCache={!usingFallback} aiEnabled={aiEnabled} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Section title={t('sharedInterests')} items={guide.sharedInterests} empty={t('none')} />
        <Section title={t('openingQuestions')} items={guide.openingQuestions} empty={t('none')} />
        <Section title={t('menteeWants')} items={guide.whatMenteeWantsToLearn} empty={t('none')} />
        <Section title={t('mentorOffers')} items={guide.whatMentorOffers} empty={t('none')} />
        <Section
          title={t('agenda')}
          items={guide.suggestedAgenda}
          empty={t('none')}
          className="sm:col-span-2"
        />
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  items,
  empty,
  className,
}: {
  title: string;
  items: string[];
  empty: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="ml-4 list-disc space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
