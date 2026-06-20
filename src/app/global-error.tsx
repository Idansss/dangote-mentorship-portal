'use client';

import { useEffect } from 'react';
import './globals.css';

// Last-resort boundary for errors thrown in the ROOT layout itself
// (production-readiness-report.md H5). It renders OUTSIDE the normal layout, so
// it must supply its own <html>/<body> and cannot use the next-intl provider —
// hence the static English copy. Route-level errors use app/error.tsx instead.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server capture via src/instrumentation.ts; client capture is a follow-up.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-muted-foreground">
            An unexpected error occurred. Please reload the page, or contact your
            programme administrator if the problem persists.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground hover:opacity-90"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
