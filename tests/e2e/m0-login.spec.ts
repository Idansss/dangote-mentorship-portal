import { test, expect } from '@playwright/test';

// M0 happy path (DoD): a user logs in with email/password and lands on a
// role-correct dashboard. Uses the seeded Super Admin account.
const ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@dangote.com';
const ADMIN_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'ChangeMe!2026';

test('super admin signs in and lands on the admin dashboard', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Admin role → /admin (lib/auth/roles.ts defaultDashboardPath).
  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();

  // The admin sidebar exposes the M0 management areas.
  const sidebar = page.getByRole('complementary');
  await expect(sidebar.getByRole('link', { name: 'Cohorts' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Invites' })).toBeVisible();
});

test('unauthenticated visitors are redirected to login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL('**/login**');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
