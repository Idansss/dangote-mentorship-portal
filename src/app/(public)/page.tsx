import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/rbac';
import { defaultDashboardPath } from '@/lib/auth/roles';
import { ArrowRight, ArrowUpRight, TrendingUp, Network, Languages, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JourneyRailView, type RailNode } from '@/components/journey-rail-view';
import { MentorshipAnimation } from '@/components/mentorship-animation';

// Public landing page (Stitch redesign — docs/stitch-redesign.md). Full-bleed
// sections matching the Stitch "Public Marketing Home": centered hero + real stat
// band → the 9-step journey showcase with an indigo AI-suggested-path pill →
// 3-card bento (middle card is the deep-teal highlight) → deep-teal closing CTA.
// All copy bilingual via the `home` namespace; stats use the real programme
// numbers (no fabricated "success rate"). The page owns its own width because the
// (public) layout runs container-free so this can go edge-to-edge.

const SHELL = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6';

export default async function HomePage() {
  // Signed-in visitors go straight to their role's dashboard.
  const currentUser = await getCurrentUser();
  if (currentUser) redirect(defaultDashboardPath(currentUser.roles));

  const t = await getTranslations('home');

  // A mentee mid-programme — illustrative rail (links nulled, no auth bounce).
  const journeyNodes: RailNode[] = [
    {
      key: 'profile',
      label: t('journey.nodes.profile'),
      stateLabel: t('journey.states.done'),
      state: 'completed',
      link: null,
      isCurrent: false,
    },
    {
      key: 'training',
      label: t('journey.nodes.training'),
      stateLabel: t('journey.states.done'),
      state: 'completed',
      link: null,
      isCurrent: false,
    },
    {
      key: 'matched',
      label: t('journey.nodes.matched'),
      stateLabel: t('journey.states.done'),
      state: 'completed',
      link: null,
      isCurrent: false,
    },
    {
      key: 'agreement',
      label: t('journey.nodes.agreement'),
      stateLabel: t('journey.states.done'),
      state: 'completed',
      link: null,
      isCurrent: false,
    },
    {
      key: 'goals',
      label: t('journey.nodes.goals'),
      stateLabel: t('journey.states.yourTurn'),
      state: 'needs_action',
      link: null,
      isCurrent: true,
    },
    {
      key: 'sessions',
      label: t('journey.nodes.sessions'),
      stateLabel: t('journey.states.upcoming'),
      state: 'pending',
      link: null,
      isCurrent: false,
    },
    {
      key: 'midterm',
      label: t('journey.nodes.midterm'),
      stateLabel: t('journey.states.upcoming'),
      state: 'pending',
      link: null,
      isCurrent: false,
    },
    {
      key: 'final',
      label: t('journey.nodes.final'),
      stateLabel: t('journey.states.upcoming'),
      state: 'pending',
      link: null,
      isCurrent: false,
    },
    {
      key: 'certificate',
      label: t('journey.nodes.certificate'),
      stateLabel: t('journey.states.upcoming'),
      state: 'pending',
      link: null,
      isCurrent: false,
    },
  ];

  const stats = [
    { value: t('stats.mentorsValue'), label: t('stats.mentors') },
    { value: t('stats.menteesValue'), label: t('stats.mentees') },
    { value: t('stats.monthsValue'), label: t('stats.months') },
    { value: t('stats.languagesValue'), label: t('stats.languages') },
  ];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <MentorshipAnimation label={t('heroBadge')} />
          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-green-strong sm:text-[3.5rem]">
            {t('heroLine1')} <span className="text-green-light">{t('heroAccent')}</span>{' '}
            {t('heroLine2')}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-body text-ink-2 sm:text-lg sm:leading-8">
            {t('heroSubtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-md px-8">
              <Link href="/login">
                {t('getStarted')}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md px-8">
              <Link href="/about">{t('aboutCta')}</Link>
            </Button>
          </div>

          {/* Real stat band */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 border-t border-border pt-12 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-h1 font-bold tabular-nums text-green-strong">
                  {s.value}
                </div>
                <div className="mt-1 text-small text-ink-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journey showcase ── */}
      <section className="bg-surface px-4 py-20 sm:px-6 sm:py-24">
        <div className={SHELL}>
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="font-display text-h1 text-green-strong">{t('journey.showcaseTitle')}</h2>
            <p className="mt-4 text-body text-ink-2">{t('journey.showcaseSubtitle')}</p>
          </div>

          <JourneyRailView
            title={t('journey.progressLabel')}
            progressLabel="50%"
            openLabel={t('journey.open')}
            nodes={journeyNodes}
          />

          {/* AI suggested path (indigo) */}
          <div className="mt-8 flex items-start gap-4 rounded-xl border border-dashed border-info/30 bg-info/[0.07] p-6">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-micro font-bold uppercase tracking-wider text-info">
                {t('aiPathLabel')}
              </p>
              <p className="mt-1 text-body italic text-ink">{t('aiPathBody')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento feature cards ── */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 sm:py-24">
        <div className={`${SHELL} grid gap-6 md:grid-cols-3`}>
          {/* Card 1 */}
          <div className="group flex flex-col justify-between rounded-xl border border-transparent bg-surface p-8 shadow-elevation transition-all hover:border-green-light/40 hover:shadow-elevation-lg">
            <div>
              <span className="mb-6 inline-flex size-12 items-center justify-center rounded-lg bg-green-soft text-green-strong transition-transform group-hover:scale-110">
                <TrendingUp className="size-6" />
              </span>
              <h3 className="font-display text-h2 text-green-strong">{t('bento.growthTitle')}</h3>
              <p className="mt-3 text-body text-ink-2">{t('bento.growthBody')}</p>
            </div>
            <Link
              href="/about"
              className="mt-8 flex items-center justify-between border-t border-border pt-6 text-micro font-bold uppercase tracking-wider text-green-strong"
            >
              {t('bento.growthCta')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card 2 — teal highlight */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-green-strong via-green to-green-strong p-8 text-white shadow-elevation-lg">
            <Network
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 size-40 text-white/10"
            />
            <div className="relative">
              <span className="mb-6 inline-flex size-12 items-center justify-center rounded-lg bg-white/15 text-white">
                <Sparkles className="size-6" />
              </span>
              <h3 className="font-display text-h2 text-white">{t('bento.knowledgeTitle')}</h3>
              <p className="mt-3 text-body text-green-soft">{t('bento.knowledgeBody')}</p>
            </div>
            <div className="relative mt-8">
              <Button
                asChild
                variant="secondary"
                className="rounded-md font-semibold text-green-strong"
              >
                <Link href="/about">{t('bento.knowledgeCta')}</Link>
              </Button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group flex flex-col justify-between rounded-xl border border-transparent bg-surface p-8 shadow-elevation transition-all hover:border-green-light/40 hover:shadow-elevation-lg">
            <div>
              <span className="mb-6 inline-flex size-12 items-center justify-center rounded-lg bg-green-soft text-green-strong transition-transform group-hover:scale-110">
                <Languages className="size-6" />
              </span>
              <h3 className="font-display text-h2 text-green-strong">{t('bento.networkTitle')}</h3>
              <p className="mt-3 text-body text-ink-2">{t('bento.networkBody')}</p>
            </div>
            <Link
              href="/about"
              className="mt-8 flex items-center justify-between border-t border-border pt-6 text-micro font-bold uppercase tracking-wider text-green-strong"
            >
              {t('bento.networkCta')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className={SHELL}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-strong via-green to-green-strong p-12 shadow-elevation-lg ring-1 ring-white/10 sm:p-20">
            <div
              aria-hidden
              className="bg-grid-light pointer-events-none absolute inset-0 opacity-70"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-green-light/30 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-display font-extrabold leading-tight text-white">
                {t('cta2Title')}
              </h2>
              <p className="mt-6 max-w-xl text-body text-green-soft sm:text-lg">
                {t('cta2Subtitle')}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="rounded-md px-8 font-semibold text-green-strong"
                >
                  <Link href="/login">
                    {t('getStarted')}
                    <ArrowUpRight className="size-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-md border-white/40 bg-transparent px-8 text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/about">{t('aboutCta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
