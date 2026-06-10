import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { MentorDashboard } from '@/features/dashboard/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mentor "what matters now" cards (experience-layer.md §1.1): my mentees, pending
// goal reviews, next meetings, session logs awaiting completion. The risk-monitor
// "mentees who need attention" and review deadlines land with M3.
function fmtDateTime(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—';
}

export async function MentorSummary({ data }: { data: MentorDashboard }) {
  const t = await getTranslations('dashboardCards');
  const tc = await getTranslations('common');

  const langLabel = (l: string | null) => (l === 'FR' ? tc('french') : l === 'EN' ? tc('english') : null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* My mentees */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{t('myMentees')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.mentees.length === 0 ? (
            <p className="text-muted-foreground">{t('noMentees')}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.mentees.map((m) => (
                <Link
                  key={m.id}
                  href={`/pair/${m.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                >
                  <span className="font-medium">{m.name ?? '—'}</span>
                  {langLabel(m.language) ? <Badge variant="outline">{langLabel(m.language)}</Badge> : null}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending goal reviews */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('pendingReviews')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/goals">{t('review')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.pendingReviewCount}</p>
          <p className="text-sm text-muted-foreground">{t('pendingReviewsHint')}</p>
        </CardContent>
      </Card>

      {/* Session logs awaiting completion */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('logsAwaiting')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/sessions">{t('logNow')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.logsAwaiting}</p>
          <p className="text-sm text-muted-foreground">{t('logsAwaitingHint')}</p>
        </CardContent>
      </Card>

      {/* Next meetings */}
      <Card className="md:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('nextMeetings')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/meetings">{t('all')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.nextMeetings.length === 0 ? (
            <p className="text-muted-foreground">{t('noNextMeeting')}</p>
          ) : (
            data.nextMeetings.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}/prepare`}
                className="flex flex-wrap items-center justify-between gap-2 hover:underline"
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-xs text-muted-foreground">
                  {m.counterpartName ? `${m.counterpartName} · ` : ''}
                  {fmtDateTime(m.startsAt)}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
