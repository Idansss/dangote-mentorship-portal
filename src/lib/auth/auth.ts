import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { RoleName } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from './password';
import { authConfig } from './auth.config';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadRoleNames(userId: string): Promise<RoleName[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, deletedAt: null },
    include: { role: true },
  });
  // De-duplicate role names across cohort-scoped grants.
  return Array.from(new Set(userRoles.map((ur) => ur.role.name)));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Allow Entra ID SSO accounts to link to an existing email/password user
  // record that an admin created ahead of time (CLAUDE.md §2).
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findFirst({
          where: { email: email.toLowerCase(), deletedAt: null, isActive: true },
        });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        const roles = await loadRoleNames(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles,
          locale: user.locale,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Node-runtime: enrich the JWT with roles + id + locale at sign-in. On
    // subsequent (edge) requests this callback isn't re-run with `user`, so the
    // values persist without hitting the database.
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Credentials sign-in already carried roles; SSO sign-in did not.
        const userWithRoles = user as { roles?: RoleName[]; locale?: string };
        token.roles = userWithRoles.roles ?? (await loadRoleNames(user.id as string));
        token.locale = userWithRoles.locale ?? 'EN';
      }
      if (trigger === 'update' && token.sub) {
        token.roles = await loadRoleNames(token.sub);
      }
      return token;
    },
  },
});
