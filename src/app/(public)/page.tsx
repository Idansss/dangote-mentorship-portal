import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Sparkles,
  Languages,
  Target,
  NotebookPen,
  MessagesSquare,
  ShieldAlert,
  ArrowRight,
  Users,
  GraduationCap,
  CalendarRange,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { JourneyRailView, type RailNode } from '@/components/journey-rail-view';

// Public landing page. Rich marketing composition built entirely from the
// design-system tokens + §4 components (§19): a soft-green gradient hero, a stat
// band, the signature Journey Rail as the hero visual, icon-led feature cards,
// and a green closing panel. Marketing copy lives in messages/{en,fr}.json so the
// page is fully bilingual. Larger-than-scale hero headline is intentional and
// scoped to this one marketing surface.

export default async function HomePage() {
  const t = await getTranslations('home');

  // A mentee mid-programme — shows completed / "your turn" / upcoming states.
  // Links are nulled so the marketing rail is purely illustrative (no auth bounce).
  const journeyNodes: RailNode[] = [
    { key: 'profile', label: t('journey.nodes.profile'), stateLabel: t('journey.states.done'), state: 'completed', link: null, isCurrent: false },
    { key: 'training', label: t('journey.nodes.training'), stateLabel: t('journey.states.done'), state: 'completed', link: null, isCurrent: false },
    { key: 'matched', label: t('journey.nodes.matched'), stateLabel: t('journey.states.done'), state: 'completed', link: null, isCurrent: false },
    { key: 'agreement', label: t('journey.nodes.agreement'), stateLabel: t('journey.states.done'), state: 'completed', link: null, isCurrent: false },
    { key: 'goals', label: t('journey.nodes.goals'), stateLabel: t('journey.states.yourTurn'), state: 'needs_action', link: null, isCurrent: true },
    { key: 'sessions', label: t('journey.nodes.sessions'), stateLabel: t('journey.states.upcoming'), state: 'pending', link: null, isCurrent: false },
    { key: 'midterm', label: t('journey.nodes.midterm'), stateLabel: t('journey.states.upcoming'), state: 'pending', link: null, isCurrent: false },
    { key: 'final', label: t('journey.nodes.final'), stateLabel: t('journey.states.upcoming'), state: 'pending', link: null, isCurrent: false },
    { key: 'certificate', label: t('journey.nodes.certificate'), stateLabel: t('journey.states.upcoming'), state: 'pending', link: null, isCurrent: false },
  ];

  const badges = [
    { icon: <Languages className="size-4" />, label: t('badgeBilingual') },
    { icon: <CalendarRange className="size-4" />, label: t('badgeJourney') },
    { icon: <Sparkles className="size-4" />, label: t('badgeAI') },
  ];

  const stats = [
    { label: t('stats.mentors'), value: t('stats.mentorsValue'), icon: <Users className="size-5" /> },
    { label: t('stats.mentees'), value: t('stats.menteesValue'), icon: <GraduationCap className="size-5" /> },
    { label: t('stats.months'), value: t('stats.monthsValue'), icon: <CalendarRange className="size-5" /> },
    { label: t('stats.languages'), value: t('stats.languagesValue'), icon: <Languages className="size-5" /> },
  ];

  const features = [
    { icon: <Sparkles className="size-5" />, title: t('features.matching.title'), body: t('features.matching.body') },
    { icon: <Languages className="size-5" />, title: t('features.bilingual.title'), body: t('features.bilingual.body') },
    { icon: <Target className="size-5" />, title: t('features.goals.title'), body: t('features.goals.body') },
    { icon: <NotebookPen className="size-5" />, title: t('features.sessions.title'), body: t('features.sessions.body') },
    { icon: <MessagesSquare className="size-5" />, title: t('features.engagement.title'), body: t('features.engagement.body') },
    { icon: <ShieldAlert className="size-5" />, title: t('features.risk.title'), body: t('features.risk.body') },
  ];

  return (
    <div className="space-y-20 pb-8">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-green-soft via-surface to-bg px-6 py-14 shadow-elevation sm:px-10 sm:py-20 lg:px-16">
        {/* soft decorative glow, reduced-motion irrelevant (static) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-green/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-green/20 bg-bg/70 px-3 py-1 text-micro uppercase text-green-strong">
            <Sparkles className="size-3.5" />
            {t('eyebrow')}
          </span>
          <h1 className="mt-6 font-display text-display font-medium tracking-tight text-ink sm:text-[2.75rem] sm:leading-[3.25rem] lg:text-[3.25rem] lg:leading-[3.75rem]">
            {t('title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-body text-ink-2 sm:text-lg sm:leading-8">
            {t('subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                {t('cta')}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/about">{t('aboutCta')}</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {badges.map((b) => (
              <li
                key={b.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1.5 text-small font-medium text-green-strong"
              >
                {b.icon}
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Stat band ── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} tone="ok" />
        ))}
      </section>

      {/* ── Journey (signature) ── */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-micro uppercase text-green-strong">{t('journey.eyebrow')}</p>
          <h2 className="font-display text-h1 font-medium text-ink">{t('journey.title')}</h2>
          <p className="text-body text-ink-2">{t('journey.subtitle')}</p>
        </div>
        <JourneyRailView
          title={t('journey.progressLabel')}
          progressLabel="50%"
          openLabel={t('journey.open')}
          nodes={journeyNodes}
        />
      </section>

      {/* ── Features ── */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-micro uppercase text-green-strong">{t('features.eyebrow')}</p>
          <h2 className="font-display text-h1 font-medium text-ink">{t('features.title')}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-elevation">
              <CardHeader className="space-y-3">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-green-soft text-green-strong">
                  {f.icon}
                </span>
                <CardTitle className="text-h3">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-body text-ink-2">{f.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="overflow-hidden rounded-[1.75rem] bg-green px-6 py-14 text-center shadow-elevation sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="font-display text-h1 font-medium text-white">{t('closing.title')}</h2>
          <p className="text-body text-green-soft">{t('closing.subtitle')}</p>
          <Button
            asChild
            size="lg"
            className="bg-white text-green-strong hover:bg-green-soft"
          >
            <Link href="/login">
              {t('closing.cta')}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="flex flex-col gap-2 border-t border-border pt-8 text-small text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.tagline')}</p>
        <p>{t('footer.privacy')}</p>
      </footer>
    </div>
  );
}
