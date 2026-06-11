'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReviewType } from '@prisma/client';
import { requestReviewReport, saveReviewSummary, type ReviewReportResult } from './actions';
import { AIContainer } from '@/components/ai-container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Client island for the AI Review Assistant (CLAUDE.md §9.4, design-system §7).
// The drafted report is editable (blue AI container) and only persisted when the
// human clicks save — AI never writes on its own (CLAUDE.md §0 rule 5).
export function ReviewAssistantPanel({
  type,
  savedSummary,
}: {
  type: ReviewType;
  savedSummary: string | null;
}) {
  const t = useTranslations('reviews');
  const tc = useTranslations('common');
  const router = useRouter();

  const [result, setResult] = useState<ReviewReportResult | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();

  function generate() {
    setError(null);
    setSaved(false);
    startGenerate(async () => {
      const res = await requestReviewReport({ type });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setResult(res.data);
      if (res.data.report) setDraft(res.data.report.summary);
    });
  }

  function save() {
    setError(null);
    startSave(async () => {
      const res = await saveReviewSummary({ type, summary: draft });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-h3">{t('assistantTitle')}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={generate} disabled={generating}>
          {generating ? t('assistantGenerating') : t('assistantGenerate')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedSummary ? (
          <div className="space-y-1">
            <p className="text-micro uppercase text-ink-3">{t('savedSummary')}</p>
            <p className="whitespace-pre-wrap text-body text-ink">{savedSummary}</p>
          </div>
        ) : (
          <p className="text-small text-ink-2">{t('assistantIntro')}</p>
        )}

        {result && !result.enabled ? (
          <p className="text-small text-ink-3">{t('assistantUnavailable')}</p>
        ) : null}

        {result?.enabled && !result.report ? (
          <p className="text-small text-ink-3">{t('assistantNoDraft')}</p>
        ) : null}

        {result?.report ? (
          <AIContainer title={t('assistantDraft')} hint={t('editableHint')}>
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                aria-label={t('assistantDraft')}
              />
              {result.report.atRisk.length > 0 ? (
                <div>
                  <p className="text-micro uppercase text-green/70">{t('atRisk')}</p>
                  <ul className="list-disc pl-5 text-small text-ink">
                    {result.report.atRisk.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.report.recommendations.length > 0 ? (
                <div>
                  <p className="text-micro uppercase text-green/70">{t('recommendations')}</p>
                  <ul className="list-disc pl-5 text-small text-ink">
                    {result.report.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Button type="button" size="sm" onClick={save} disabled={saving || !draft.trim()}>
                {saving ? tc('loading') : t('saveSummary')}
              </Button>
            </div>
          </AIContainer>
        ) : null}

        {saved ? <p className="text-small text-green-strong">{t('summarySaved')}</p> : null}
        {error ? <p className="text-small text-risk" role="alert">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
