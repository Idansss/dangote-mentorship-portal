import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Users, Target, ClipboardList, Video, ChevronRight } from 'lucide-react';
import type { MentorDashboard } from '@/features/dashboard/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile, type StatTileProps } from '@/components/ui/stat-tile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Mentor "what matters now" cards (experience-layer.md §1.1): an icon-led stat
// band (mentees, goals to review, logs to complete), my mentees with avatars,
// and upcoming meetings. The risk-monitor "mentees who need attention" and review
// deadlines land with M3.
function fmtDateTime(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—';
}

function initials(name: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '—';
}

// Deep-linked StatTile with the same hover-lift the admin tiles use.
function Tile({ href, ...props }: StatTileProps & { href?: string }) {
  if (!href) return <StatTile {...props} />;
  return (
    <Link
      href={href}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30"
    >
      <StatTile {...props} className="h-full transition-shadow hover:shadow-elevation" />
    </Link>
  );
}

export async function MentorSummary({ data }: { data: MentorDashboard }) {
  const t = await getTranslations('dashboardCards');
  const tc = await getTranslations('common');

  const langLabel = (l: string | null) => (l === 'FR' ? tc('french') : l === 'EN' ? tc('english') : null);

  return (
    <div className="space-y-4">
      {/* Stat band */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          href="/pair"
          label={t('myMentees')}
          value={data.mentees.length}
          tone="ok"
          icon={<Users className="size-5" />}
        />
        <Tile
          href="/goals"
          label={t('pendingReviews')}
          value={data.pendingReviewCount}
          hint={t('pendingReviewsHint')}
          tone={data.pendingReviewCount > 0 ? 'warn' : 'default'}
          icon={<Target className="size-5" />}
        />
        <Tile
          href="/sessions"
          label={t('logsAwaiting')}
          value={data.logsAwaiting}
          hint={t('logsAwaitingHint')}
          tone={data.logsAwaiting > 0 ? 'warn' : 'default'}
          icon={<ClipboardList className="size-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* My mentees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">{t('myMentees')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.mentees.length === 0 ? (
              <p className="text-muted-foreground">{t('noMentees')}</p>
            ) : (
              <div className="grid gap-2">
                {data.mentees.map((m) => (
                  <Link
                    key={m.id}
                    href={`/pair/${m.id}`}
                    className="group flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-green/40 hover:bg-green-soft/40"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{m.name ?? '—'}</span>
                    {langLabel(m.language) ? (
                      <Badge variant="outline">{langLabel(m.language)}</Badge>
                    ) : null}
                    <ChevronRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next meetings */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-h3">{t('nextMeetings')}</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/meetings">{t('all')}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.nextMeetings.length === 0 ? (
              <p className="text-muted-foreground">{t('noNextMeeting')}</p>
            ) : (
              data.nextMeetings.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}/prepare`}
                  className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors hover:bg-surface"
                >
                  <span className="flex items-center gap-2 font-medium text-ink">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-green-soft text-green-strong">
                      <Video className="size-3.5" />
                    </span>
                    {m.title}
                  </span>
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
    </div>
  );
}
