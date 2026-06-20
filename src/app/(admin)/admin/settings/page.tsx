import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, hasAnyRole } from '@/lib/auth/rbac';
import { RoleName } from '@/lib/auth/roles';
import { isMaintenanceMode } from '@/features/settings/maintenance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MaintenanceToggle } from './maintenance-toggle';

// Platform settings live with the Super Admin (CLAUDE.md §4: "Manage
// platform/cohorts" is Super-Admin only). Programme Admins can reach the rest of
// the admin area but not this page.
export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!hasAnyRole(user, RoleName.SUPER_ADMIN)) redirect('/admin');

  const t = await getTranslations('settings');
  const enabled = await isMaintenanceMode();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('maintenanceTitle')}</CardTitle>
          <CardDescription>{t('maintenanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceToggle initialEnabled={enabled} />
        </CardContent>
      </Card>
    </section>
  );
}
