import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CohortStatus, MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/rbac';
import { ApproveMatchButton, OverrideMatchForm } from '@/features/matching/match-actions';
import { RunMatchingButton } from '@/features/matching/run-matching-button';
import { getPairsTimeline } from '@/features/matching/timeline';
import { PairsTimelineView } from '@/features/matching/pairs-timeline';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MatchingPage() {
  const t = await getTranslations('matching');
  const current = await getCurrentUser();
  const lang = current?.locale === 'FR' ? 'FR' : 'EN';

  // M1 works against the active cohort; multi-cohort selection arrives with
  // the cohort switcher in a later milestone.
  const cohort = await prisma.cohort.findFirst({
    where: { deletedAt: null, status: CohortStatus.ACTIVE },
    orderBy: { createdAt: 'desc' },
  });
  if (!cohort) {
    return <p className="text-muted-foreground">{t('noSuggestions')}</p>;
  }

  const [suggestions, timeline, mentorOptions] = await Promise.all([
    prisma.match.findMany({
      where: { cohortId: cohort.id, status: MatchStatus.SUGGESTED, deletedAt: null },
      orderBy: { score: 'desc' },
      include: {
        mentor: { select: { id: true, name: true, mentorProfile: { select: { id: true } } } },
        mentee: { select: { id: true, name: true, menteeProfile: { select: { id: true } } } },
      },
    }),
    getPairsTimeline(cohort.id),
    prisma.mentorProfile.findMany({
      where: { cohortId: cohort.id, deletedAt: null },
      select: { userId: true, fullName: true, preferredLanguage: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  // Group suggestions by mentee for ranked display.
  const byMentee = new Map<string, typeof suggestions>();
  for (const s of suggestions) {
    const list = byMentee.get(s.menteeId) ?? [];
    list.push(s);
    byMentee.set(s.menteeId, list);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-h1 font-medium text-ink">{t('title')}</h1>
          <p className="text-body text-ink-2">{cohort.name}</p>
        </div>
        <RunMatchingButton
          cohortId={cohort.id}
          labels={{
            run: t('run'),
            running: t('running'),
            doneTitle: t('runDoneTitle'),
            done: t('runDone'),
            allMatched: t('runAllMatched'),
            errorTitle: t('runErrorTitle'),
          }}
        />
      </header>

      <p className="text-small text-ink-2">{t('runHint')}</p>
      <p className="rounded-md bg-green-soft/60 px-3 py-2 text-small font-medium text-green-strong">
        {t('languageRule')}
      </p>

      {byMentee.size === 0 ? (
        <p className="text-muted-foreground">{t('noSuggestions')}</p>
      ) : (
        <div className="space-y-4">
          {Array.from(byMentee.entries()).map(([menteeId, list]) => {
            const first = list[0];
            if (!first) return null;
            return (
              <Card key={menteeId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-h3">
                    {t('suggestionsFor')}{' '}
                    {first.mentee.menteeProfile ? (
                      <Link
                        href={`/admin/mentees/${first.mentee.menteeProfile.id}`}
                        className="text-green hover:text-green-strong hover:underline"
                      >
                        {first.mentee.name}
                      </Link>
                    ) : (
                      first.mentee.name
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="flex items-center gap-2 font-medium text-ink">
                          {s.mentor.mentorProfile ? (
                            <Link
                              href={`/admin/mentors/${s.mentor.mentorProfile.id}`}
                              className="text-green hover:text-green-strong hover:underline"
                            >
                              {s.mentor.name}
                            </Link>
                          ) : (
                            s.mentor.name
                          )}
                          <Badge variant="ok">
                            {t('score')}: {Math.round(s.score)}
                          </Badge>
                        </p>
                        <p className="text-small text-ink-2">{s.aiRationale}</p>
                        {Array.isArray(s.flags) && s.flags.length > 0 ? (
                          <p className="flex flex-wrap gap-1">
                            {(s.flags as string[]).map((f) => (
                              <Badge key={f} variant="warn">
                                {f}
                              </Badge>
                            ))}
                          </p>
                        ) : null}
                      </div>
                      <ApproveMatchButton
                        matchId={s.id}
                        mentorName={s.mentor.name ?? ''}
                        menteeName={first.mentee.name ?? ''}
                        labels={{
                          approve: t('approve'),
                          approving: t('approving'),
                          doneTitle: t('approveDoneTitle'),
                          done: t('approveDone'),
                          errorTitle: t('approveErrorTitle'),
                        }}
                      />
                    </div>
                  ))}

                  <details className="rounded-lg border border-border p-3">
                    <summary className="cursor-pointer text-small font-medium text-ink">{t('override')}</summary>
                    <OverrideMatchForm
                      cohortId={cohort.id}
                      menteeId={menteeId}
                      menteeName={first.mentee.name ?? ''}
                      mentorOptions={mentorOptions.map((m) => ({
                        userId: m.userId,
                        fullName: m.fullName,
                        preferredLanguage: m.preferredLanguage,
                      }))}
                      labels={{
                        mentor: t('mentor'),
                        overrideSubmit: t('overrideSubmit'),
                        assigning: t('assigning'),
                        doneTitle: t('overrideDoneTitle'),
                        done: t('overrideDone'),
                        errorTitle: t('overrideErrorTitle'),
                      }}
                    />
                  </details>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-h2 text-ink">{t('committedTitle')}</h2>
        <PairsTimelineView timeline={timeline} lang={lang} />
      </div>
    </section>
  );
}
