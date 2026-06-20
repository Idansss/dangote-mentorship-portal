import type { MetadataRoute } from 'next';

// This is a confidential, auth-gated internal portal — it must never be indexed
// (production-readiness-report.md M5). Reinforces the X-Robots-Tag header set in
// next.config.mjs.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
