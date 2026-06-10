import { defineConfig, devices } from '@playwright/test';

// E2E tests run against the dev server with the seeded demo cohort
// (CLAUDE.md §2: one happy-path E2E per milestone). Requires a running
// Postgres with migrations + `npm run db:seed` applied. Run: `npm run test:e2e`.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    // Port 3001 matches AUTH_URL in .env (3000 is commonly taken on dev boxes).
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
