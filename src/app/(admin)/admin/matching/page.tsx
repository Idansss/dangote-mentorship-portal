import { getTranslations } from 'next-intl/server';
import { CohortStatus, MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { approveMatchForm, overrideMatchForm, runMatchingForm } from '@/features/matching/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function MatchingPage() {
  const t = await getTranslations('matching');

  // M1 works against the active cohort; multi-cohort selection arrives with
  // the cohort switcher in a later milestone.
  const cohort = await prisma.cohort.findFirst({
    where: { deletedAt: null, status: CohortStatus.ACTIVE },
    orderBy: { createdAt: 'desc' },
  });
  if (!cohort) {
    return <p className="text-muted-foreground">{t('noSuggestions')}</p>;
  }

  const [suggestions, committed, mentorOptions] = await Promise.all([
    prisma.match.findMany({
      where: { cohortId: cohort.id, status: MatchStatus.SUGGESTED, deletedAt: null },
      orderBy: { score: 'desc' },
      include: {
        mentor: { select: { id: true, name: true } },
        mentee: { select: { id: true, name: true } },
      },
    }),
    prisma.match.findMany({
      where: {
        cohortId: cohort.id,
        status: { in: [MatchStatus.ADMIN_APPROVED, MatchStatus.OVERRIDDEN, MatchStatus.ACCEPTED] },
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        mentor: { select: { name: true } },
        mentee: { select: { name: true } },
      },
    }),
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{cohort.name}</p>
        </div>
        <form action={runMatchingForm}>
          <input type="hidden" name="cohortId" value={cohort.id} />
          <Button type="submit">{t('run')}</Button>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">{t('runHint')}</p>
      <p className="text-sm font-medium text-primary">{t('languageRule')}</p>

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
                  <CardTitle className="text-base">
                    {t('suggestionsFor')} {first.mentee.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {list.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-start justify-between gap-3 rounded border p-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium">
                          {s.mentor.name}{' '}
                          <Badge variant="secondary">
                            {t('score')}: {Math.round(s.score)}
                          </Badge>
                        </p>
                        <p className="text-sm text-muted-foreground">{s.aiRationale}</p>
                        {Array.isArray(s.flags) && s.flags.length > 0 ? (
                          <p className="flex flex-wrap gap-1">
                            {(s.flags as string[]).map((f) => (
                              <Badge key={f} variant="outline" className="text-xs">
                                {f}
                              </Badge>
                            ))}
                          </p>
                        ) : null}
                      </div>
                      <form action={approveMatchForm}>
                        <input type="hidden" name="matchId" value={s.id} />
                        <Button type="submit" size="sm">
                          {t('approve')}
                        </Button>
                      </form>
                    </div>
                  ))}

                  <details className="rounded border p-3">
                    <summary className="cursor-pointer text-sm font-medium">{t('override')}</summary>
                    <form action={overrideMatchForm} className="mt-3 flex flex-wrap items-end gap-3">
                      <input type="hidden" name="cohortId" value={cohort.id} />
                      <input type="hidden" name="menteeId" value={menteeId} />
                      <select
                        name="mentorId"
                        required
                        aria-label={t('mentor')}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {mentorOptions.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.fullName} ({m.preferredLanguage})
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        {t('overrideSubmit')}
                      </Button>
                    </form>
                  </details>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="text-xl font-semibold">{t('committedTitle')}</h2>
      {committed.length === 0 ? (
        <p className="text-muted-foreground">{t('noSuggestions')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('mentor')}</TableHead>
              <TableHead>{t('mentee')}</TableHead>
              <TableHead>{t('score')}</TableHead>
              <TableHead>{t('statusLabel')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {committed.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.mentor.name}</TableCell>
                <TableCell>{m.mentee.name}</TableCell>
                <TableCell>{Math.round(m.score)}</TableCell>
                <TableCell>
                  <Badge variant={m.status === MatchStatus.ACCEPTED ? 'default' : 'secondary'}>
                    {m.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
