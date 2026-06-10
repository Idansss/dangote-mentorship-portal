import type { Config } from 'tailwindcss';

// Theme extension for the Design System (§19 — docs/design-system.md). Colors
// reference the RGB-channel tokens in globals.css via `rgb(var(--x) / <alpha>)`
// so alpha modifiers work. Both the palette names (green, ink, surface, status)
// and the shadcn semantic aliases are exposed.
const withAlpha = (token: string) => `rgb(var(${token}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1280px' }, // content max-width ~1280 (§3)
    },
    extend: {
      colors: {
        // ── Palette tokens (§1) ──
        bg: withAlpha('--bg'),
        surface: { DEFAULT: withAlpha('--surface'), 2: withAlpha('--surface-2') },
        ink: { DEFAULT: withAlpha('--ink'), 2: withAlpha('--ink-2'), 3: withAlpha('--ink-3') },
        green: {
          DEFAULT: withAlpha('--green'),
          strong: withAlpha('--green-strong'),
          soft: withAlpha('--green-soft'),
        },
        gold: withAlpha('--gold'),
        ok: withAlpha('--ok'),
        warn: withAlpha('--warn'),
        risk: withAlpha('--risk'),
        info: withAlpha('--info'),

        // ── shadcn semantic aliases (themed onto the palette) ──
        border: withAlpha('--border'),
        input: withAlpha('--input'),
        ring: withAlpha('--ring'),
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        primary: { DEFAULT: withAlpha('--primary'), foreground: withAlpha('--primary-foreground') },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--destructive'),
          foreground: withAlpha('--destructive-foreground'),
        },
        muted: { DEFAULT: withAlpha('--muted'), foreground: withAlpha('--muted-foreground') },
        accent: { DEFAULT: withAlpha('--accent'), foreground: withAlpha('--accent-foreground') },
        popover: { DEFAULT: withAlpha('--popover'), foreground: withAlpha('--popover-foreground') },
        card: { DEFAULT: withAlpha('--card'), foreground: withAlpha('--card-foreground') },
      },
      fontFamily: {
        // Fraunces = display/headings; Inter = body/UI (§2). Self-hosted via
        // next/font (variables set in app/layout.tsx).
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Type scale (§2) — [size, lineHeight].
        display: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '500' }], // 36/44
        h1: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '500' }], // 28/36
        h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20/28
        h3: ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }], // 16/24
        body: ['0.9375rem', { lineHeight: '1.5rem' }], // 15/24
        small: ['0.8125rem', { lineHeight: '1.25rem' }], // 13/20
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em', fontWeight: '600' }], // 11/16
      },
      borderRadius: {
        lg: 'var(--radius)', // 12px cards
        md: 'calc(var(--radius) - 4px)', // 8px controls
        sm: 'calc(var(--radius) - 6px)', // 6px
      },
      boxShadow: {
        // One soft elevation only (§3) — no heavy drop shadows.
        elevation: '0 1px 2px rgba(20,32,26,.04), 0 4px 16px rgba(20,32,26,.06)',
      },
      keyframes: {
        'rail-fill': { from: { width: '0%' }, to: { width: 'var(--rail-fill, 0%)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
