import 'server-only';
import * as Sentry from '@sentry/nextjs';

// Central error-reporting seam (production-readiness-report.md H2). Always logs
// structured context; forwards to Sentry too, which is a no-op until Sentry is
// initialized (see src/instrumentation.ts — only when SENTRY_DSN is set). This
// mirrors the codebase's "degrade gracefully when env unset" pattern (AI, mail,
// storage). Never include message/prompt bodies or other PII in `context`.
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  // Structured server log; forwarded to Sentry too when configured.
  console.error('[error]', error instanceof Error ? error.message : error, context ?? {});
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
