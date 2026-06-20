import * as Sentry from '@sentry/nextjs';

// Browser Sentry init (auto-loaded by Next 15.3+). Uses the PUBLIC DSN so it can
// ship to the client; no-op until NEXT_PUBLIC_SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE ?? '0.1'),
  sendDefaultPii: false,
});

// Lets Sentry trace client-side route transitions (Next instrumentation hook).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
