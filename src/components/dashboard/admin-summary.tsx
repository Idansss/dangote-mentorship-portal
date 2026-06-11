import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Users,
  GraduationCap,
  UserPlus,
  LifeBuoy,
  Target,
  CheckCircle2,
  Video,
  Award,
} from 'lucide-react';
import type { AdminDashboard } from '@/features/dashboard/data';
import { StatTile, type StatTileProps } from '@/components/ui/stat-tile';

// Admin "programme at a glance" tiles (experience-layer.md §1.1 / §19 §8), from
// records available today. Now icon-led, status-toned, and deep-linked. Review
// completion (M3), clinic attendance (M4) and the programme health score (Tier 2)
// join as they land.
function Tile({ href, ...props }: StatTileProps & { href?: string }) {
  if (!href) return <StatTile {...props} />;
  return (
    <Link href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30">
      <StatTile {...props} className="h-full transition-shadow hover:shadow-elevation" />
    </Link>
  );
}

export async function AdminSummary({ data }: { data: AdminDashboard }) {
  const t = await getTranslations('dashboardCards');
  const trained = data.mentorsTrained + data.menteesTrained;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        href="/admin/matching"
        label={t('activePairs')}
        value={data.activePairs}
        tone="ok"
        icon={<Users className="size-5" />}
      />
      <Tile
        href="/admin/mentees"
        label={t('unmatchedMentees')}
        value={data.unmatchedMentees}
        tone={data.unmatchedMentees > 0 ? 'warn' : 'default'}
        icon={<GraduationCap className="size-5" />}
      />
      <Tile
        href="/admin/mentors"
        label={t('unmatchedMentors')}
        value={data.unmatchedMentors}
        tone={data.unmatchedMentors > 0 ? 'warn' : 'default'}
        icon={<UserPlus className="size-5" />}
      />
      <Tile
        href="/admin/support"
        label={t('openSupport')}
        value={data.openSupport}
        tone={data.openSupport > 0 ? 'risk' : 'default'}
        icon={<LifeBuoy className="size-5" />}
      />
      <Tile
        href="/admin/goals"
        label={t('goalsSubmitted')}
        value={data.goalsSubmitted}
        icon={<Target className="size-5" />}
      />
      <Tile
        href="/admin/goals"
        label={t('goalsApproved')}
        value={data.goalsApproved}
        tone="ok"
        icon={<CheckCircle2 className="size-5" />}
      />
      <Tile
        href="/admin/meetings"
        label={t('upcomingMeetings')}
        value={data.upcomingMeetings}
        icon={<Video className="size-5" />}
      />
      <Tile
        href="/admin/training"
        label={t('trainingCompleted')}
        value={trained}
        icon={<Award className="size-5" />}
      />
    </div>
  );
}
