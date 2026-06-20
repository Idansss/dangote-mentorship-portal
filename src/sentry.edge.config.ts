import * as Sentry from '@sentry/nextjs';

// Edge-runtime Sentry init (middleware + edge routes), loaded by
// src/instrumentation.ts. withSentryConfig ensures this resolves to Sentry's
// edge-safe build, so it doesn't trip the edge runtime's no-code-generation
// rule. No-op until SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE ?? '0.1'),
  sendDefaultPii: false,
});
