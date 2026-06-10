import { getTranslations } from 'next-intl/server';
import { MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { respondToMatchForm } from './actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Match panel on the mentor/mentee dashboards: shows pairs awaiting the
// user's response (admin-approved or overridden) and active accepted pairs.
export async function MatchPanel({ userId, role }: { userId: string; role: 'mentor' | 'mentee' }) {
  const t = await getTranslations('matching');

  const where = role === 'mentor' ? { mentorId: userId } : { menteeId: userId };
  const matches = await prisma.match.findMany({
    where: {
      ...where,
      deletedAt: null,
      status: { in: [MatchStatus.ADMIN_APPROVED, MatchStatus.OVERRIDDEN, MatchStatus.ACCEPTED] },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      mentor: { select: { name: true, email: true } },
      mentee: { select: { name: true, email: true } },
    },
  });

  const pending = matches.filter((m) => m.status !== MatchStatus.ACCEPTED);
  const accepted = matches.filter((m) => m.status === MatchStatus.ACCEPTED);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('myMatchTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noMatchYet')}</p>
        ) : null}

        {pending.map((m) => {
          const other = role === 'mentor' ? m.mentee : m.mentor;
          return (
            <div key={m.id} className="space-y-2 rounded border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{other.name}</p>
                <Badge variant="outline">{t('pendingYourResponse')}</Badge>
              </div>
              {m.aiRationale ? (
                <p className="text-sm text-muted-foreground">{m.aiRationale}</p>
              ) : null}
              <div className="flex gap-2">
                <form action={respondToMatchForm}>
                  <input type="hidden" name="matchId" value={m.id} />
                  <input type="hidden" name="decision" value="accept" />
                  <Button type="submit" size="sm">
                    {t('acceptMatch')}
                  </Button>
                </form>
                <form action={respondToMatchForm}>
                  <input type="hidden" name="matchId" value={m.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Button type="submit" size="sm" variant="ghost">
                    {t('rejectMatch')}
                  </Button>
                </form>
              </div>
            </div>
          );
        })}

        {accepted.map((m) => {
          const other = role === 'mentor' ? m.mentee : m.mentor;
          return (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
              <div>
                <p className="font-medium">{other.name}</p>
                <p className="text-sm text-muted-foreground">{other.email}</p>
              </div>
              <Badge>{t('matchedWith')}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
