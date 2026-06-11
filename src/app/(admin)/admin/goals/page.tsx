import { getTranslations } from 'next-intl/server';
import { getProgrammeGoals } from '@/features/admin/overview-data';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Programme-wide goals drill-down (reached from the admin dashboard "Goals
// submitted / approved" tiles). Read-only; the admin area layout already gates
// to admin roles (§4).
export default async function AdminGoalsPage() {
  const t = await getTranslations('adminLists');
  const goals = await getProgrammeGoals();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-h1 text-ink">{t('goalsTitle')}</h1>
        <p className="text-body text-ink-2">{t('goalsSubtitle')}</p>
      </div>

      {goals.length === 0 ? (
        <p className="text-body text-ink-3">{t('noGoals')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('colMentee')}</TableHead>
              <TableHead>{t('colGoal')}</TableHead>
              <TableHead>{t('colCompetency')}</TableHead>
              <TableHead>{t('colStatus')}</TableHead>
              <TableHead>{t('colCohort')}</TableHead>
              <TableHead>{t('colCreated')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.menteeName ?? '—'}</TableCell>
                <TableCell>{g.title}</TableCell>
                <TableCell>{g.competency ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={g.status === 'APPROVED' || g.status === 'COMPLETED' ? 'default' : 'outline'}>
                    {g.status}
                  </Badge>
                </TableCell>
                <TableCell>{g.cohortName}</TableCell>
                <TableCell>{g.createdAt.toISOString().slice(0, 10)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
