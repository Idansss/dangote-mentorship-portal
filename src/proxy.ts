import NextAuth from 'next-auth';
import authConfig from '@/lib/auth/auth.config';

// Next 16 renamed the `middleware` file convention to `proxy`; this is the same
// edge entry point under the new name. Route gating runs from the edge-safe
// config (no Prisma). Per-action RBAC is still enforced server-side via
// requireRole() (CLAUDE.md §3, §4).
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
