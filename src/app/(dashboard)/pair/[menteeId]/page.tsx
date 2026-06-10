import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/rbac';
import { getPairWorkspace, type PairPerson } from '@/features/pair/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IcebreakerCard } from './icebreaker-card';

// Pair Contract Page (experience-layer.md §1.8): the shared home base for one
// matched pair, aggregating the records they already share. Read-only here —
// every section deep-links to the page where the work is actually done. Direct
// messaging is the one entry point that lands with the M4 community features.
export default async function PairPage({ params }: { params: Promise<{ menteeId: string }> }) {
  const { menteeId } = await params;
  const user = await requireUser();
  const t = await getTranslations('pair');
  const tg = await getTranslations('goals');
  const ts = await getTranslations('sessions');

  const pair = await getPairWorkspace(user.id, menteeId);
  if (!pair) notFound();

  const fmtDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '—');
  const fmtDateTime = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Who's in the pair */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PersonCard label={t('mentorLabel')} person={pair.mentor} />
        <PersonCard label={t('menteeLabel')} person={pair.mentee} />
      </div>

      {/* First-session icebreaker (§1.17) */}
      <IcebreakerCard viewerId={user.id} menteeId={menteeId} />

      {/* Agreements */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('agreementsTitle')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/agreements">{t('open')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pair.agreements.map((a) => (
            <div key={a.type} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{t(`agreementType.${a.type}`)}</span>
              <span className="flex flex-wrap gap-1">
                <SignBadge
                  who={pair.mentor.name ?? t('mentorLabel')}
                  signedLabel={t('signed')}
                  pendingLabel={t('notSigned')}
                  signedAt={a.mentorSignedAt}
                />
                <SignBadge
                  who={pair.mentee.name ?? t('menteeLabel')}
                  signedLabel={t('signed')}
                  pendingLabel={t('notSigned')}
                  signedAt={a.menteeSignedAt}
                />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Meetings + logistics */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('meetingsTitle')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/meetings">{t('open')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">{t('nextMeeting')}: </span>
            {pair.nextMeeting ? (
              <Link className="text-primary hover:underline" href={`/meetings/${pair.nextMeeting.id}/prepare`}>
                {pair.nextMeeting.title} · {fmtDateTime(pair.nextMeeting.startsAt)}
              </Link>
            ) : (
              <span className="text-muted-foreground">{t('noNextMeeting')}</span>
            )}
          </p>
          <p className="text-muted-foreground">
            {t('meetingsHeld', { count: pair.meetingCount })} · {t('sessionsLogged', { count: pair.sessionCount })}
            {pair.lastSessionAt ? ` · ${t('lastSession')} ${fmtDate(pair.lastSessionAt)}` : ''}
          </p>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('goalsTitle')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/goals">{t('open')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pair.goals.length === 0 ? (
            <p className="text-muted-foreground">{t('noGoals')}</p>
          ) : (
            pair.goals.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{g.title}</span>
                <span className="flex gap-1">
                  <Badge variant="outline">{tg(`stage.${g.stage}`)}</Badge>
                  <Badge variant="secondary">{tg(`status.${g.status}`)}</Badge>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Open action items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('actionItemsTitle')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/sessions">{t('open')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pair.openActionItems.length === 0 ? (
            <p className="text-muted-foreground">{t('noActionItems')}</p>
          ) : (
            pair.openActionItems.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{a.title}</span>
                <span className="flex items-center gap-2 text-xs">
                  {a.assigneeName ? <span className="text-muted-foreground">{a.assigneeName}</span> : null}
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

      {/* Direct messages — lands with the M4 community features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('messagesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t('messagesComingSoon')}</CardContent>
      </Card>
    </div>
  );
}

async function PersonCard({ label, person }: { label: string; person: PairPerson }) {
  const t = await getTranslations('pair');
  const tc = await getTranslations('common');
  const langLabel = person.language === 'FR' ? tc('french') : person.language === 'EN' ? tc('english') : null;
  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <CardTitle className="text-base">{person.name ?? '—'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        {person.jobTitle ? <p>{person.jobTitle}</p> : null}
        {person.department ? <p>{person.department}</p> : null}
        {langLabel ? (
          <p>
            {tc('language')}: {langLabel}
          </p>
        ) : null}
        {person.phone ? (
          <p>
            {t('phone')}: {person.phone}
          </p>
        ) : null}
        {person.availability ? (
          <p>
            {t('availability')}: {person.availability}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SignBadge({
  who,
  signedAt,
  signedLabel,
  pendingLabel,
}: {
  who: string;
  signedAt: Date | null;
  signedLabel: string;
  pendingLabel: string;
}) {
  return (
    <Badge variant={signedAt ? 'default' : 'outline'} title={who}>
      {who.split(' ')[0]}: {signedAt ? signedLabel : pendingLabel}
    </Badge>
  );
}
