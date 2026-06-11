import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Languages, CalendarRange, Sparkles, ShieldCheck } from 'lucide-react';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Wordmark } from '@/components/wordmark';

// Auth chrome (§19, auth surface) — an Atlas-style split screen: a dark-green
// brand panel on the left (value props + grid texture, hidden on mobile) and the
// form column on the right. Wraps every auth page (login, signup, forgot/reset,
// invite) so they all share the same premium frame.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  const ta = await getTranslations('auth');
  const th = await getTranslations('home');

  const points = [
    { icon: <Languages className="size-4" />, label: th('badgeBilingual') },
    { icon: <CalendarRange className="size-4" />, label: th('badgeJourney') },
    { icon: <Sparkles className="size-4" />, label: th('badgeAI') },
    { icon: <ShieldCheck className="size-4" />, label: th('footer.privacy') },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel (desktop only) ── */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-green-strong via-green to-green-strong p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-light opacity-70" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-green-light/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-16 bottom-0 size-72 rounded-full bg-white/10 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 font-display text-h3 font-bold ring-1 ring-white/25">
            D
          </span>
          <Wordmark
            name={t('appName')}
            className="font-display text-h3 font-bold text-green-soft"
            accentClassName="text-white"
          />
        </Link>

        <div className="relative max-w-md space-y-6">
          <h2 className="font-display text-[1.9rem] font-extrabold leading-tight">{ta('brandTitle')}</h2>
          <p className="text-body text-green-soft">{ta('brandSubtitle')}</p>
          <ul className="space-y-3">
            {points.map((p) => (
              <li key={p.label} className="flex items-center gap-3 text-small">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                  {p.icon}
                </span>
                <span className="text-green-soft">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-small text-green-soft/80">{th('footer.tagline')}</p>
      </aside>

      {/* ── Form column ── */}
      <div className="flex flex-col bg-bg">
        <header className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-h3 font-bold text-ink lg:hidden">
            <Wordmark name={t('appName')} />
          </Link>
          <span className="hidden lg:block" />
          <LocaleSwitcher />
        </header>
        <main className="container flex flex-1 items-center justify-center py-12">{children}</main>
      </div>
    </div>
  );
}
