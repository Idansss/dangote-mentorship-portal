import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import {
  Sparkles,
  Languages,
  Target,
  NotebookPen,
  MessagesSquare,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Workflow,
  FileCheck2,
  Users,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JourneyRailView, type RailNode } from '@/components/journey-rail-view';

// Public landing page (§19, marketing surface). Atlas-HR-style structure — a bold
// two-column hero with an AI "assistant" preview card, a big-number stat band,
// and a dark closing panel — warmed with MentORR-style touches: a hand-written
// script accent on the headline, playful doodles, and colourful (but on-token)
// benefit cards. Identity stays green/white; all copy is bilingual via the `home`
// namespace. Larger-than-scale hero type is intentional and scoped to this page.

// Hand-drawn underline under the hero's script accent (the MentORR flourish).
function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 14"
      fill="none"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M3 8.5C52 3.5 110 3 150 5.5C190 8 248 9 297 4.5"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function HomePage() {
  // Signed-in visitors don't belong on the marketing page — send them straight to
  // their role's dashboard so the landing surface is for logged-out users only.
  const currentUser = await getCurrentUser();
  if (currentUser) redirect(defaultDashboardPath(currentUser.roles));

  const t = await getTranslations('home');

  // A mentee mid-programme — completed / "your turn" / upcoming states. Links are
  // nulled so the marketing rail is purely illustrative (no auth bounce).
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
    { label: t('stats.mentors'), value: t('stats.mentorsValue'), icon: <Users className="size-5" />, grad: 'from-blue-500 to-indigo-600' },
    { label: t('stats.mentees'), value: t('stats.menteesValue'), icon: <GraduationCap className="size-5" />, grad: 'from-emerald-500 to-teal-600' },
    { label: t('stats.months'), value: t('stats.monthsValue'), icon: <CalendarRange className="size-5" />, grad: 'from-amber-500 to-orange-600' },
    { label: t('stats.languages'), value: t('stats.languagesValue'), icon: <Languages className="size-5" />, grad: 'from-violet-500 to-purple-600' },
  ];

  // Benefit cards get a vivid per-card gradient chip + matching top bar — the
  // Atlas-style multi-colour pop (decorative, scoped to this marketing surface).
  const tones = [
    { grad: 'from-emerald-500 to-teal-600' },
    { grad: 'from-blue-500 to-indigo-600' },
    { grad: 'from-amber-500 to-orange-600' },
    { grad: 'from-cyan-500 to-sky-600' },
    { grad: 'from-violet-500 to-purple-600' },
    { grad: 'from-pink-500 to-rose-600' },
  ] as const;
  const features = [
    { icon: <Sparkles className="size-5" />, title: t('features.matching.title'), body: t('features.matching.body') },
    { icon: <Languages className="size-5" />, title: t('features.bilingual.title'), body: t('features.bilingual.body') },
    { icon: <Target className="size-5" />, title: t('features.goals.title'), body: t('features.goals.body') },
    { icon: <NotebookPen className="size-5" />, title: t('features.sessions.title'), body: t('features.sessions.body') },
    { icon: <MessagesSquare className="size-5" />, title: t('features.engagement.title'), body: t('features.engagement.body') },
    { icon: <ShieldAlert className="size-5" />, title: t('features.risk.title'), body: t('features.risk.body') },
  ];

  const reasoning = [t('preview.point1'), t('preview.point2'), t('preview.point3')];

  return (
    <div className="space-y-24 pb-8">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-green-soft/70 via-surface to-bg px-6 py-12 shadow-elevation sm:px-10 sm:py-16 lg:px-14">
        {/* grid texture overlay (kept separate from the gradient — both set
            background-image, so they can't share one element) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid" />
        {/* soft brand glow + concentric-ring doodle (MentORR) */}
        <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full bg-green-light/10 blur-3xl" />
        <svg aria-hidden viewBox="0 0 80 80" className="pointer-events-none absolute right-8 top-8 hidden size-20 text-gold/50 lg:block">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="40" cy="40" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left — headline + CTAs */}
          <div className="max-w-xl">
            <h1 className="font-display text-[2.1rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem] lg:text-[3.1rem]">
              {/* lead: solid ink with a soft layered shadow for a 3D lift */}
              <span className="text-ink [text-shadow:0_1px_1px_rgb(16_42_26/0.18),0_4px_12px_rgb(16_42_26/0.14)]">
                {t('heroTitleLead')}
              </span>{' '}
              <span className="relative inline-block">
                {/* accent: gradient fill + drop-shadow depth (Atlas "cross borders" style) */}
                <span className="bg-gradient-to-r from-green-strong via-green to-green-light bg-clip-text pr-1 text-transparent drop-shadow-[0_3px_5px_rgb(31_115_56/0.30)]">
                  {t('heroTitleAccent')}
                </span>
                <Squiggle className="absolute -bottom-1 left-0 h-2.5 w-full text-green-light" />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-body text-ink-2 sm:text-lg sm:leading-8">{t('subtitle')}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full pr-2">
                <Link href="/login">
                  {t('cta')}
                  <span className="ml-1 inline-flex size-7 items-center justify-center rounded-full bg-white/20">
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/about">{t('aboutCta')}</Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-2">
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

          {/* Right — AI assistant preview card (Atlas sandbox style) */}
          <div className="relative">
            <svg aria-hidden viewBox="0 0 120 60" className="pointer-events-none absolute -left-10 -top-8 hidden h-14 w-28 text-green-light/40 lg:block">
              <path d="M4 50C30 20 60 12 116 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 7" strokeLinecap="round" />
              <path d="M104 4l13 4-9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-elevation-lg">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-green-light to-green text-white shadow-glow">
                  <Workflow className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-h3 text-ink">{t('preview.eyebrow')}</p>
                  <p className="truncate text-small text-ink-3">{t('preview.subtitle')}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-small font-medium text-green-strong">
                  <span className="size-2 rounded-full bg-green-light" />
                  {t('preview.status')}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4">
                <p className="text-micro uppercase text-info">{t('preview.asksLabel')}</p>
                <p className="mt-1 text-body font-medium text-ink">{t('preview.question')}</p>
              </div>

              <ul className="mt-3 space-y-2">
                {reasoning.map((point) => (
                  <li key={point} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-[3px] border-green-light" />
                    <span className="text-small text-ink-2">{point}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-small font-semibold text-white transition-colors hover:bg-green-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <FileCheck2 className="size-4" />
                {t('preview.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat band (colourful elevated panel) ── */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-8 rounded-[1.5rem] border border-border bg-surface p-6 shadow-elevation sm:grid-cols-4 sm:p-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={i > 0 ? 'sm:border-l sm:border-border sm:pl-6' : undefined}
          >
            <span
              className={`inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-elevation ${s.grad}`}
            >
              {s.icon}
            </span>
            <p className="mt-4 font-display text-[2.25rem] font-extrabold leading-none tracking-tight text-ink tabular-nums">
              {s.value}
            </p>
            <p className="mt-2 text-small text-ink-2">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Journey (signature) — framed so the white rail card floats on a
          soft-green panel for depth ── */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-green-soft/60 via-surface to-bg p-6 shadow-elevation sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-green-light/10 blur-3xl" />
        <div className="relative space-y-6">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 text-micro uppercase text-green-strong">
              <CalendarRange className="size-3.5" />
              {t('journey.eyebrow')}
            </p>
            <h2 className="font-display text-h1 text-ink">{t('journey.title')}</h2>
            <p className="text-body text-ink-2">{t('journey.subtitle')}</p>
          </div>
          <JourneyRailView
            title={t('journey.progressLabel')}
            progressLabel="50%"
            openLabel={t('journey.open')}
            nodes={journeyNodes}
          />
        </div>
      </section>

      {/* ── Benefits (Atlas-style colourful cards) ── */}
      <section className="space-y-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const tone = tones[i % tones.length]!;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[1.25rem] border border-border bg-surface p-6 shadow-elevation transition-shadow hover:shadow-elevation-lg"
              >
                <span aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.grad}`} />
                <span className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-elevation ${tone.grad}`}>
                  {f.icon}
                </span>
                <h3 className="mt-4 font-display text-h3 text-ink">{f.title}</h3>
                <p className="mt-2 text-body text-ink-2">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing CTA (Atlas dark panel) ── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-strong via-green to-green-strong px-6 py-16 text-center shadow-elevation-lg ring-1 ring-white/10 sm:px-10 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-light opacity-70" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-green-light/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <h2 className="font-display text-[1.9rem] font-extrabold leading-tight text-white sm:text-[2.4rem]">
            {t('closing.title')}
          </h2>
          <p className="mx-auto max-w-xl text-body text-green-soft sm:text-lg">{t('closing.subtitle')}</p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full px-7 font-semibold text-green-strong"
            >
              <Link href="/login">
                {t('closing.cta')}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
            >
              <Link href="/about">{t('aboutCta')}</Link>
            </Button>
          </div>
          <p className="pt-1 text-small text-green-soft/90">{t('closing.micro')}</p>
        </div>
      </section>
    </div>
  );
}
