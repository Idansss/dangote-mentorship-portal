import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RoleName } from '@prisma/client';
import { requireUser } from '@/lib/auth/rbac';
import { getViewablePairs } from '@/features/pair/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Entry point for the Pair Contract Page (§1.8). A mentee has a single pair and
// is sent straight to it; a mentor picks which mentee's workspace to open.
export default async function PairIndexPage() {
  const user = await requireUser();
  const t = await getTranslations('pair');

  const isMentor = user.roles.includes(RoleName.MENTOR);
  const isMentee = user.roles.includes(RoleName.MENTEE);

  if (!isMentor && !isMentee) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-h1 text-ink">{t('title')}</h1>
        <p className="text-ink-2">{t('noAccess')}</p>
      </div>
    );
  }

  const pairs = await getViewablePairs(user.id, { isMentor, isMentee });

  if (pairs.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-h1 text-ink">{t('title')}</h1>
        <p className="text-ink-2">{t('noPair')}</p>
      </div>
    );
  }

  // A mentee (single pair) goes straight in.
  const only = pairs[0];
  if (pairs.length === 1 && !isMentor && only) {
    redirect(`/pair/${only.menteeId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-ink">{t('title')}</h1>
        <p className="text-ink-2">{t('pickMentee')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pairs.map((p) => (
          <Link key={p.menteeId} href={`/pair/${p.menteeId}`} className="block">
            <Card className="transition-colors hover:bg-surface-2">
              <CardHeader>
                <CardTitle className="text-h3">{p.menteeName ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent className="text-small text-ink-2">{t('openWorkspace')}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
