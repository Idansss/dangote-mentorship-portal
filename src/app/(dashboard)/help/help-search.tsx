'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Client search over the Help Center articles (experience-layer.md §1.11). The
// localized title + summary are passed in from the server; filtering is a simple
// case-insensitive contains so it works offline and instantly.
export interface HelpArticleMeta {
  slug: string;
  title: string;
  summary: string;
}

export function HelpSearch({ articles }: { articles: HelpArticleMeta[] }) {
  const t = useTranslations('help');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q),
    );
  }, [articles, query]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((a) => (
            <Link key={a.slug} href={`/help/${a.slug}`} className="block">
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{a.summary}</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
