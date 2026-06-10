import { RoleName } from '@prisma/client';

export { RoleName };

// All six roles (CLAUDE.md §4), most-privileged first.
export const ALL_ROLES: RoleName[] = [
  RoleName.SUPER_ADMIN,
  RoleName.PROGRAMME_ADMIN,
  RoleName.MENTOR,
  RoleName.MENTEE,
  RoleName.TRAINER,
  RoleName.REVIEWER,
];

// Roles that may act in any admin context. Used for coarse route gating;
// fine-grained capability checks still go through requireRole per action.
export const ADMIN_ROLES: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.PROGRAMME_ADMIN];

export function isAdminRole(role: RoleName): boolean {
  return ADMIN_ROLES.includes(role);
}

// Where each role lands after login (CLAUDE.md M0 DoD: role-correct dashboard).
export function defaultDashboardPath(roles: RoleName[]): string {
  if (roles.some((r) => ADMIN_ROLES.includes(r))) return '/admin';
  if (roles.includes(RoleName.REVIEWER)) return '/dashboard/reviewer';
  if (roles.includes(RoleName.TRAINER)) return '/dashboard/trainer';
  if (roles.includes(RoleName.MENTOR)) return '/dashboard/mentor';
  if (roles.includes(RoleName.MENTEE)) return '/dashboard/mentee';
  return '/dashboard';
}
