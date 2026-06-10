import { RoleName } from '@prisma/client';
import { auth } from './auth';

// Authorization errors. Server actions translate these into typed results
// (CLAUDE.md §3: every mutation authenticates → authorizes → validates …).
export class UnauthenticatedError extends Error {
  code = 'UNAUTHENTICATED' as const;
  constructor() {
    super('You must be signed in to perform this action.');
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends Error {
  code = 'FORBIDDEN' as const;
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  roles: RoleName[];
  locale: string;
}

/** Returns the current session user, or null if unauthenticated. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name,
    roles: session.user.roles ?? [],
    locale: session.user.locale ?? 'EN',
  };
}

/** Asserts the request is authenticated and returns the user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export function hasAnyRole(user: SessionUser, allowed: RoleName | RoleName[]): boolean {
  const allow = Array.isArray(allowed) ? allowed : [allowed];
  return user.roles.some((r) => allow.includes(r));
}

/**
 * Server-side RBAC guard (CLAUDE.md §4). Call at the top of every protected
 * server action: `const user = await requireRole(['SUPER_ADMIN']);`
 * Throws UnauthenticatedError / ForbiddenError, which mapActionError() turns
 * into a typed failure result.
 */
export async function requireRole(allowed: RoleName | RoleName[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasAnyRole(user, allowed)) {
    throw new ForbiddenError();
  }
  return user;
}
