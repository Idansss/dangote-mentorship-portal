import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { AdminDashboard } from '@/features/dashboard/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Admin "programme at a glance" tiles (experience-layer.md §1.1), from records
// available today. Review completion (M3), clinic attendance (M4), at-risk pairs
// (M3 risk monitor), and the programme health score (Tier 2) join as they land.
function Stat({ value, label, href }: { value: number; label: string; href?: string }) {
  const inner = (
    <Card className={href ? 'h-full transition-colors hover:border-primary' : 'h-full'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export async function AdminSummary({ data }: { data: AdminDashboard }) {
  const t = await getTranslations('dashboardCards');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat value={data.activePairs} label={t('activePairs')} href="/admin/matching" />
      <Stat value={data.unmatchedMentees} label={t('unmatchedMentees')} href="/admin/mentees" />
      <Stat value={data.unmatchedMentors} label={t('unmatchedMentors')} href="/admin/mentors" />
      <Stat value={data.openSupport} label={t('openSupport')} href="/admin/support" />
      <Stat value={data.goalsSubmitted} label={t('goalsSubmitted')} />
      <Stat value={data.goalsApproved} label={t('goalsApproved')} />
      <Stat value={data.upcomingMeetings} label={t('upcomingMeetings')} />
      <Stat value={data.mentorsTrained + data.menteesTrained} label={t('trainingCompleted')} />
    </div>
  );
}
