import type { NextAuthConfig } from 'next-auth';
import type { RoleName } from '@prisma/client';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

// Edge-safe base config. NO Prisma import here (not even the RoleName enum) —
// this config is what middleware.ts instantiates, so it must stay outside the
// Node-only graph. The Credentials provider, the Prisma adapter, and the
// role-loading jwt callback are added in auth.ts (Node runtime only).
//
// Admin role names are duplicated here as string literals to avoid pulling the
// Prisma client into the edge bundle; the canonical list lives in roles.ts.
const ADMIN_ROLE_NAMES = new Set(['SUPER_ADMIN']);

// `/design` is the Design System component preview (§19) — a dev/demo gallery,
// no real data. Public so it can be reviewed without a session; gate or remove
// before production.
const PUBLIC_PREFIXES = ['/about', '/faq', '/programme', '/mentor-guide', '/mentee-guide', '/design'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') return true;
  if (pathname.startsWith('/invite')) return true; // invite acceptance is public
  // Password recovery is public (the token is the credential).
  if (pathname === '/forgot-password' || pathname.startsWith('/reset-password')) return true;
  if (pathname.startsWith('/api/auth')) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    // Primary SSO provider (CLAUDE.md §2). OAuth config is edge-safe.
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`
        : undefined,
      // Link an Entra SSO sign-in to an admin-pre-created account that shares the
      // same email, instead of creating a duplicate User (CLAUDE.md §2: Entra SSO
      // + admin-created accounts must be the same identity). This is only safe
      // because Entra is a trusted IdP that verifies email ownership; never enable
      // it for an unverified provider.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Coarse route gating (CLAUDE.md §3). Fine-grained authz is enforced
    // per server action via requireRole().
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      if (isPublicPath(pathname)) return true;

      const roles = (auth?.user?.roles ?? []) as string[];
      const isLoggedIn = Boolean(auth?.user);
      if (!isLoggedIn) return false;

      if (pathname.startsWith('/admin')) {
        return roles.some((r) => ADMIN_ROLE_NAMES.has(r));
      }
      return true;
    },
    // Edge-safe: copy the role/id/locale already embedded in the token onto the
    // session. The token itself is populated by the Node-side jwt callback.
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.roles = (token.roles ?? []) as RoleName[];
        session.user.locale = (token.locale ?? 'EN') as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
