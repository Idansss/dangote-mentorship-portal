import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { HelpCircle, LifeBuoy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function FaqPage() {
  const t = await getTranslations('faq');
  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 pb-8 sm:px-6">
      {/* Hero */}
      <section className="space-y-3">
        <p className="text-micro uppercase text-green-strong">{t('eyebrow')}</p>
        <h1 className="font-display text-[2.1rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-body text-ink-2 sm:text-lg sm:leading-8">{t('subtitle')}</p>
      </section>

      {/* Questions */}
      <dl className="space-y-4">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-[1.25rem] border border-border bg-surface p-6 shadow-elevation"
          >
            <dt className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-soft text-green-strong">
                <HelpCircle className="size-4" />
              </span>
              <span className="font-display text-h3 text-ink">{item.q}</span>
            </dt>
            <dd className="mt-3 pl-11 text-body text-ink-2">{item.a}</dd>
          </div>
        ))}
      </dl>

      {/* Still need help */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-border bg-gradient-to-br from-green-soft/60 via-surface to-bg p-6 shadow-elevation sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-light to-green text-white shadow-glow">
            <LifeBuoy className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 className="font-display text-h3 text-ink">{t('helpTitle')}</h2>
            <p className="text-small text-ink-2">{t('helpBody')}</p>
          </div>
        </div>
        <Button asChild className="shrink-0 rounded-full">
          <Link href="/login">
            {t('helpCta')}
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}
