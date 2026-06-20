import type { Instrumentation } from 'next';

// Server error tracking (production-readiness-report.md H2). Sentry is imported
// LAZILY and only in the Node runtime: importing it at module top-level pulls in
// code that uses dynamic code generation, which the EDGE runtime forbids — that
// breaks middleware (every request 500s). So edge/client capture is intentionally
// deferred to a follow-up via Sentry's `withSentryConfig`; this covers server
// components, route handlers, server actions, and API routes, which is the bulk.
//
// All no-ops until SENTRY_DSN is set, matching the app's graceful-degradation
// convention (AI, mail, storage).
export async function register(): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE ?? '0.1'),
    // Don't capture request bodies / headers that may carry PII (§14).
    sendDefaultPii: false,
  });
}

// Captures errors thrown in server components, route handlers, and server
// actions (Next 15 `onRequestError` hook) — Node runtime only.
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME !== 'nodejs') return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
