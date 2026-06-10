import { getTranslations } from 'next-intl/server';
import type { RoleName } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

// Slim header for the personalized dashboards (experience-layer.md §1.1) — the
// rich "what matters now" content lives in the summary cards below it, so this
// replaces the M0 stub shell for matched roles.
export async function DashboardHeader({
  titleKey,
  userName,
  roles,
}: {
  titleKey: 'mentor' | 'mentee';
  userName?: string | null;
  roles: RoleName[];
}) {
  const t = await getTranslations('dashboard');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-h1 text-ink">{t(titleKey)}</h1>
        <p className="text-ink-2">
          {t('welcome')}
          {userName ? `, ${userName}` : ''}.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge key={role} variant="neutral">
            {role}
          </Badge>
        ))}
      </div>
    </div>
  );
}
