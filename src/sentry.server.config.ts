import * as Sentry from '@sentry/nextjs';

// Node-runtime Sentry init (loaded by src/instrumentation.ts). No-op until
// SENTRY_DSN is set — `enabled` gates it so dev/CI never phone home.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE ?? '0.1'),
  // Don't capture request bodies / headers that may carry PII (CLAUDE.md §14).
  sendDefaultPii: false,
});
