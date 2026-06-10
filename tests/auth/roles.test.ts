import { describe, expect, it } from 'vitest';
import { RoleName } from '@prisma/client';
import { ADMIN_ROLES, defaultDashboardPath, isAdminRole } from '@/lib/auth/roles';

describe('role helpers', () => {
  it('routes each role to its dashboard', () => {
    expect(defaultDashboardPath([RoleName.SUPER_ADMIN])).toBe('/admin');
    expect(defaultDashboardPath([RoleName.PROGRAMME_ADMIN])).toBe('/admin');
    expect(defaultDashboardPath([RoleName.REVIEWER])).toBe('/dashboard/reviewer');
    expect(defaultDashboardPath([RoleName.TRAINER])).toBe('/dashboard/trainer');
    expect(defaultDashboardPath([RoleName.MENTOR])).toBe('/dashboard/mentor');
    expect(defaultDashboardPath([RoleName.MENTEE])).toBe('/dashboard/mentee');
  });

  it('prioritizes admin landing when a user holds multiple roles', () => {
    expect(defaultDashboardPath([RoleName.MENTOR, RoleName.SUPER_ADMIN])).toBe('/admin');
  });

  it('falls back to the generic dashboard with no roles', () => {
    expect(defaultDashboardPath([])).toBe('/dashboard');
  });

  it('identifies admin roles', () => {
    expect(isAdminRole(RoleName.SUPER_ADMIN)).toBe(true);
    expect(isAdminRole(RoleName.MENTOR)).toBe(false);
    expect(ADMIN_ROLES).toContain(RoleName.PROGRAMME_ADMIN);
  });
});
