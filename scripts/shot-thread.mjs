// One-off: log in, open Messages, click the first conversation, screenshot.
import { chromium } from 'playwright';
const [email, password, out] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://localhost:3001';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + '/login', { waitUntil: 'networkidle' });
await page.fill('#email', email);
await page.fill('#password', password);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }).catch(() => {});
await page.goto(base + '/messages', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const href = await page.locator('a[href^="/messages/"]').first().getAttribute('href').catch(() => null);
if (href) {
  await page.goto(base + href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}
console.log('href:', href);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out, '→', page.url());
