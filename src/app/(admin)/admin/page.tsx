import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminDashboard } from '@/features/dashboard/data';
import { AdminSummary } from '@/components/dashboard/admin-summary';
import { NextActionButton } from '@/components/next-action-button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminHomePage() {
  const t = await getTranslations('admin');
  const [programmes, cohorts, dashboard] = await Promise.all([
    prisma.programme.count({ where: { deletedAt: null } }),
    prisma.cohort.count({ where: { deletedAt: null } }),
    getAdminDashboard(),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <NextActionButton />

      <AdminSummary data={dashboard} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/programmes">
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>{programmes}</CardTitle>
              <CardDescription>{t('programmes')}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/cohorts">
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>{cohorts}</CardTitle>
              <CardDescription>{t('cohorts')}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </section>
  );
}
