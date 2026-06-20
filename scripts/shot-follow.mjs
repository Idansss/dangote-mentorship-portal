// Log in, open a list page, follow the first link matching a prefix, screenshot.
// Usage: node scripts/shot-follow.mjs <email> <pw> <listPath> <linkPrefix> <out> [w] [h]
import { chromium } from 'playwright';
const [email, password, listPath, prefix, out] = process.argv.slice(2);
const width = Number(process.argv[7] ?? 1440);
const height = Number(process.argv[8] ?? 1600);
const base = process.env.BASE_URL ?? 'http://localhost:3001';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(base + '/login', { waitUntil: 'networkidle' });
await page.fill('#email', email);
await page.fill('#password', password);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }).catch(() => {});
await page.goto(base + listPath, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const href = await page.locator(`a[href^="${prefix}"]`).first().getAttribute('href').catch(() => null);
if (href) {
  await page.goto(base + href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}
console.log('href:', href);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out, '→', page.url());
