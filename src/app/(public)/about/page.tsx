import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Sparkles, Languages, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AboutPage() {
  const t = await getTranslations('about');
  const th = await getTranslations('home');

  const pillars = [
    {
      icon: <Sparkles className="size-5" />,
      grad: 'from-blue-500 to-indigo-600',
      title: th('features.matching.title'),
      body: th('features.matching.body'),
    },
    {
      icon: <Languages className="size-5" />,
      grad: 'from-emerald-500 to-teal-600',
      title: th('features.bilingual.title'),
      body: th('features.bilingual.body'),
    },
    {
      icon: <Target className="size-5" />,
      grad: 'from-violet-500 to-purple-600',
      title: th('features.goals.title'),
      body: th('features.goals.body'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-16 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-green-soft/60 via-surface to-bg p-8 shadow-elevation sm:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-green-light/10 blur-3xl" />
        <div className="relative max-w-3xl space-y-4">
          <p className="text-micro uppercase text-green-strong">{t('eyebrow')}</p>
          <h1 className="font-display text-[2.1rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
            {t('title')}
          </h1>
          <p className="text-body text-ink-2 sm:text-lg sm:leading-8">{t('body')}</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="space-y-6">
        <h2 className="font-display text-h1 text-ink">{t('pillarsTitle')}</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="relative overflow-hidden rounded-[1.25rem] border border-border bg-surface p-6 shadow-elevation"
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.grad}`} />
              <span className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-elevation ${p.grad}`}>
                {p.icon}
              </span>
              <h3 className="mt-4 font-display text-h3 text-ink">{p.title}</h3>
              <p className="mt-2 text-body text-ink-2">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-strong via-green to-green-strong px-6 py-14 text-center shadow-elevation-lg ring-1 ring-white/10 sm:px-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-light opacity-70" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-green-light/30 blur-3xl" />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <h2 className="font-display text-[1.7rem] font-extrabold leading-tight text-white sm:text-[2.1rem]">
            {t('ctaTitle')}
          </h2>
          <p className="text-body text-green-soft">{t('ctaBody')}</p>
          <div className="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="rounded-full px-7 font-semibold text-green-strong">
              <Link href="/login">
                {t('signin')}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
            >
              <Link href="/signup">{t('requestAccess')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
