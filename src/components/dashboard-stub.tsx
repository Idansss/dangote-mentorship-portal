import { getTranslations } from 'next-intl/server';
import { RoleName } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Shared role-correct dashboard shell for M0. Feature widgets per role
// (CLAUDE.md §12) arrive in later milestones — this is intentionally a stub,
// not an empty module.
export async function DashboardStub({
  titleKey,
  userName,
  roles,
}: {
  titleKey: 'mentor' | 'mentee' | 'trainer' | 'reviewer' | 'generic';
  userName?: string | null;
  roles: RoleName[];
}) {
  const t = await getTranslations('dashboard');
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
          <p className="text-muted-foreground">
            {t('welcome')}
            {userName ? `, ${userName}` : ''}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('generic')}</CardTitle>
          <CardDescription>{t('stub')}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t('roleLabel')}</CardContent>
      </Card>
    </section>
  );
}
