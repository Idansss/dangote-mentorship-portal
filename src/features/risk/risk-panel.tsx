import { getTranslations } from 'next-intl/server';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CohortRisk } from './data';
import type { RiskFlag } from './rules';

// At-risk pairs panel (CLAUDE.md §9.8, §12; experience-layer.md §1.1). Renders
// the metadata-only risk flags — no message/reflection content ever appears here.
export async function RiskPanel({ risk }: { risk: CohortRisk }) {
  const t = await getTranslations('risk');

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-h3">{t('title')}</CardTitle>
        <div className="flex gap-2">
          {risk.atRiskCount > 0 ? <Badge variant="risk">{t('atRiskCount', { count: risk.atRiskCount })}</Badge> : null}
          {risk.watchCount > 0 ? <Badge variant="warn">{t('watchCount', { count: risk.watchCount })}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {risk.pairs.length === 0 ? (
          <div className="flex items-center gap-2 text-small text-green-strong">
            <ShieldCheck className="size-4" aria-hidden />
            <p>{t('allHealthy')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {risk.pairs.map((p) => (
              <li key={p.matchId} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={p.severity === 'risk' ? 'size-4 text-risk' : 'size-4 text-warn'}
                    aria-hidden
                  />
                  <span className="text-body text-ink">
                    {p.mentorName ?? '—'} <span className="text-ink-3">·</span> {p.menteeName ?? '—'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.flags.map((f) => (
                    <Badge key={f.code} variant={f.severity === 'risk' ? 'risk' : 'warn'}>
                      {flagLabel(t, f)}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function flagLabel(t: Awaited<ReturnType<typeof getTranslations>>, flag: RiskFlag): string {
  return t(`flag.${flag.code}`, { ...(flag.params ?? {}) });
}
