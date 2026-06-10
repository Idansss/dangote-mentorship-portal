import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MeetingStatus } from '@prisma/client';
import type { MeetingWithPeople } from '@/features/meetings/data';
import { isUpcoming, needsNoShowCapture } from '@/features/meetings/status';
import { cancelMeetingAction } from '@/features/meetings/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoShowPrompt } from './no-show-prompt';

function fmtDateTime(d: Date | null): string {
  if (!d) return '—';
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export async function MeetingCard({
  meeting,
  currentUserId,
}: {
  meeting: MeetingWithPeople;
  currentUserId: string;
}) {
  const t = await getTranslations('meetings');

  const other = meeting.mentorId === currentUserId ? meeting.mentee : meeting.mentor;
  const upcoming = isUpcoming(meeting);
  const needsCapture = needsNoShowCapture(meeting);

  const statusBadge =
    meeting.didHappen === true
      ? { label: t('tookPlace'), variant: 'default' as const }
      : meeting.didHappen === false
        ? { label: t('didNotTakePlace'), variant: 'secondary' as const }
        : meeting.status === MeetingStatus.CANCELLED
          ? { label: t('cancelled'), variant: 'secondary' as const }
          : { label: t('scheduled'), variant: 'outline' as const };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{meeting.title}</CardTitle>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{t(`meetingType.${meeting.type}`)}</Badge>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {fmtDateTime(meeting.startsAt)}
          {meeting.endsAt ? ` – ${fmtDateTime(meeting.endsAt).slice(11)}` : ''} · {other.name}
        </p>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {meeting.joinUrl ? (
          <a className="text-primary underline" href={meeting.joinUrl} target="_blank" rel="noreferrer">
            {t('joinLink')}
          </a>
        ) : null}

        {meeting.didHappen === false && meeting.noShowReason ? (
          <p className="text-muted-foreground">
            {t('reason')}: {t(`reasonOption.${meeting.noShowReason}`)}
          </p>
        ) : null}

        {upcoming ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/meetings/${meeting.id}/prepare`}>{t('prepare')}</Link>
            </Button>
            <form action={cancelMeetingAction}>
              <input type="hidden" name="meetingId" value={meeting.id} />
              <Button type="submit" size="sm" variant="ghost">
                {t('cancel')}
              </Button>
            </form>
          </div>
        ) : null}

        {needsCapture ? <NoShowPrompt meetingId={meeting.id} /> : null}
      </CardContent>
    </Card>
  );
}
