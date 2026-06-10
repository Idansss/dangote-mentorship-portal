import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { MenteeDashboard } from '@/features/dashboard/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mentee "what matters now" cards (experience-layer.md §1.1): my mentor, current
// goals with progress bars, pending action items, next meeting. Mobile-first.
function fmtDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : '—';
}
function fmtDateTime(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—';
}

export async function MenteeSummary({ data }: { data: MenteeDashboard }) {
  const t = await getTranslations('dashboardCards');
  const tc = await getTranslations('common');
  const ts = await getTranslations('sessions');
  const tg = await getTranslations('goals');

  const langLabel = (l: string | null) => (l === 'FR' ? tc('french') : l === 'EN' ? tc('english') : null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* My mentor */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('myMentor')}</CardTitle>
          {data.mentor ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/pair">{t('openPair')}</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="text-sm">
          {data.mentor ? (
            <div className="space-y-1">
              <p className="font-medium">{data.mentor.name ?? '—'}</p>
              {data.mentor.jobTitle ? <p className="text-muted-foreground">{data.mentor.jobTitle}</p> : null}
              {data.mentor.department ? <p className="text-muted-foreground">{data.mentor.department}</p> : null}
              {langLabel(data.mentor.language) ? (
                <p className="text-muted-foreground">
                  {tc('language')}: {langLabel(data.mentor.language)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('noMentor')}</p>
          )}
        </CardContent>
      </Card>

      {/* Next meeting */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('nextMeeting')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/meetings">{t('all')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="text-sm">
          {data.nextMeeting ? (
            <Link href={`/meetings/${data.nextMeeting.id}/prepare`} className="block hover:underline">
              <span className="font-medium">{data.nextMeeting.title}</span>
              <span className="block text-muted-foreground">{fmtDateTime(data.nextMeeting.startsAt)}</span>
            </Link>
          ) : (
            <p className="text-muted-foreground">{t('noNextMeeting')}</p>
          )}
        </CardContent>
      </Card>

      {/* Goals with progress bars */}
      <Card className="md:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('myGoals')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/goals">{t('all')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {data.goals.length === 0 ? (
            <p className="text-muted-foreground">{t('noGoals')}</p>
          ) : (
            data.goals.map((g) => (
              <div key={g.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span>{g.title}</span>
                  <Badge variant="secondary">{tg(`status.${g.status}`)}</Badge>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={g.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={g.title}
                >
                  <div className="h-full bg-green-600 transition-all" style={{ width: `${g.percent}%` }} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending action items */}
      <Card className="md:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('myActions')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/sessions">{t('all')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.actionItems.length === 0 ? (
            <p className="text-muted-foreground">{t('noActions')}</p>
          ) : (
            data.actionItems.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{a.title}</span>
                <span className="flex items-center gap-2 text-xs">
                  {a.dueDate ? (
                    <span className={a.overdue ? 'font-medium text-red-700' : 'text-muted-foreground'}>
                      {a.overdue ? ts('overdue') : ts('due')} {fmtDate(a.dueDate)}
                    </span>
                  ) : null}
                  <Badge variant="outline">{ts(`itemStatus.${a.status}`)}</Badge>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
