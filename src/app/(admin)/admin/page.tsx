import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FolderKanban, Layers } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { getAdminDashboard } from '@/features/dashboard/data';
import { getCohortRisk, resolveActiveCohortId } from '@/features/risk/data';
import { RiskPanel } from '@/features/risk/risk-panel';
import { AdminSummary } from '@/components/dashboard/admin-summary';
import { NextActionButton } from '@/components/next-action-button';
import { StatTile } from '@/components/ui/stat-tile';

export default async function AdminHomePage() {
  const t = await getTranslations('admin');
  const [programmes, cohorts, dashboard, cohortId] = await Promise.all([
    prisma.programme.count({ where: { deletedAt: null } }),
    prisma.cohort.count({ where: { deletedAt: null } }),
    getAdminDashboard(),
    resolveActiveCohortId(),
  ]);
  const risk = cohortId ? await getCohortRisk(cohortId) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-h1 font-bold text-ink">{t('title')}</h1>
        <p className="text-body text-ink-2">{t('overviewSubtitle')}</p>
      </header>

      <AdminSummary data={dashboard} />

      {/* AI suggested actions — full-width indigo band (Stitch admin) */}
      <NextActionButton />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {risk ? <RiskPanel risk={risk} /> : null}
        </div>
        <section className="space-y-4">
          <h2 className="text-micro uppercase text-ink-3">{t('setup')}</h2>
          <Link
            href="/admin/programmes"
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30"
          >
            <StatTile
              label={t('programmes')}
              value={programmes}
              icon={<FolderKanban className="size-5" />}
              className="transition-shadow hover:shadow-elevation"
            />
          </Link>
          <Link
            href="/admin/cohorts"
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30"
          >
            <StatTile
              label={t('cohorts')}
              value={cohorts}
              icon={<Layers className="size-5" />}
              className="transition-shadow hover:shadow-elevation"
            />
          </Link>
        </section>
      </div>
    </div>
  );
}
