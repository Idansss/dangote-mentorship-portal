import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ImportRowStatus, ImportStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { commitImportForm, fixImportRowForm, setImportRowStatusForm } from '@/features/imports/actions';
import { cleanRow, hasBlockingErrors, type Finding } from '@/features/imports/validation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function statusVariant(status: ImportRowStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case ImportRowStatus.VALID:
    case ImportRowStatus.FIXED:
    case ImportRowStatus.ACCEPTED:
      return 'default';
    case ImportRowStatus.REJECTED:
      return 'destructive';
    case ImportRowStatus.FLAGGED:
      return 'outline';
    default:
      return 'secondary';
  }
}

export default async function ImportReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('imports');

  const imported = await prisma.import.findUnique({
    where: { id },
    include: {
      cohort: { select: { name: true } },
      rows: { where: { deletedAt: null }, orderBy: { rowNumber: 'asc' } },
    },
  });
  if (!imported || imported.deletedAt) notFound();

  const isCommitted = imported.status === ImportStatus.COMMITTED;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('reviewTitle')}</h1>
          <p className="text-muted-foreground">
            {imported.fileName} · {imported.cohort.name} ·{' '}
            {imported.targetRole === 'MENTOR' ? t('mentors') : t('mentees')}
          </p>
        </div>
        {isCommitted ? (
          <Badge>{t('committed')}</Badge>
        ) : (
          <form action={commitImportForm}>
            <input type="hidden" name="importId" value={imported.id} />
            <Button type="submit">{t('commit')}</Button>
          </form>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{t('blockedHint')}</p>

      <div className="space-y-4">
        {imported.rows.map((row) => {
          const findings = (row.validation ?? []) as unknown as Finding[];
          const clean = cleanRow(row.raw as Record<string, unknown>);
          const blocked = hasBlockingErrors(findings);
          const decided =
            row.status === ImportRowStatus.ACCEPTED || row.status === ImportRowStatus.REJECTED;

          return (
            <Card key={row.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {t('row')} {row.rowNumber}: {clean.fullName || '—'}{' '}
                    <span className="font-normal text-muted-foreground">
                      {clean.email || '—'} · {clean.language || '—'} · {clean.department || '—'}
                    </span>
                  </CardTitle>
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {findings.length === 0 ? (
                  <p className="text-sm text-primary">{t('noFindings')}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {findings.map((f, i) => (
                      <li key={`${f.code}-${i}`} className="flex items-center gap-2">
                        <Badge variant={f.severity === 'ERROR' ? 'destructive' : 'outline'}>
                          {f.severity}
                        </Badge>
                        {f.message}
                      </li>
                    ))}
                  </ul>
                )}

                {!isCommitted && !decided ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setImportRowStatusForm}>
                      <input type="hidden" name="rowId" value={row.id} />
                      <input type="hidden" name="status" value={ImportRowStatus.ACCEPTED} />
                      <Button type="submit" size="sm" variant="outline" disabled={blocked}>
                        {t('accept')}
                      </Button>
                    </form>
                    <form action={setImportRowStatusForm}>
                      <input type="hidden" name="rowId" value={row.id} />
                      <input type="hidden" name="status" value={ImportRowStatus.REJECTED} />
                      <Button type="submit" size="sm" variant="ghost">
                        {t('reject')}
                      </Button>
                    </form>
                  </div>
                ) : null}

                {!isCommitted && row.status !== ImportRowStatus.REJECTED ? (
                  <details className="rounded border p-3">
                    <summary className="cursor-pointer text-sm font-medium">{t('fix')}</summary>
                    <form action={fixImportRowForm} className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="rowId" value={row.id} />
                      <div className="space-y-1">
                        <Label htmlFor={`name-${row.id}`}>{t('name')}</Label>
                        <Input id={`name-${row.id}`} name="fullName" defaultValue={clean.fullName} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`email-${row.id}`}>{t('email')}</Label>
                        <Input id={`email-${row.id}`} name="email" defaultValue={clean.email} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`lang-${row.id}`}>{t('languageField')}</Label>
                        <select
                          id={`lang-${row.id}`}
                          name="language"
                          defaultValue={clean.language}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">—</option>
                          <option value="EN">EN</option>
                          <option value="FR">FR</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`dept-${row.id}`}>{t('department')}</Label>
                        <Input id={`dept-${row.id}`} name="department" defaultValue={clean.department} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`job-${row.id}`}>{t('jobTitle')}</Label>
                        <Input id={`job-${row.id}`} name="jobTitle" defaultValue={clean.jobTitle} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`exp-${row.id}`}>{t('experience')}</Label>
                        <Input
                          id={`exp-${row.id}`}
                          name="yearsExperience"
                          defaultValue={clean.yearsExperience ?? ''}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`comp-${row.id}`}>{t('competencies')}</Label>
                        <Input
                          id={`comp-${row.id}`}
                          name="competencies"
                          defaultValue={clean.competencies.join(', ')}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`goals-${row.id}`}>{t('careerGoals')}</Label>
                        <Input id={`goals-${row.id}`} name="careerGoals" defaultValue={clean.careerGoals} />
                      </div>
                      <div className="sm:col-span-2">
                        <Button type="submit" size="sm">
                          {t('saveFix')}
                        </Button>
                      </div>
                    </form>
                  </details>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
