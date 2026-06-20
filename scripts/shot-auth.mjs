// Authenticated screenshot helper for the Stitch redesign review.
// Usage: node scripts/shot-auth.mjs <email> <password> <path> <outfile> [w] [h]
import { chromium } from 'playwright';

const [email, password, path, out] = process.argv.slice(2);
const width = Number(process.argv[6] ?? 1440);
const height = Number(process.argv[7] ?? 2200);
const base = process.env.BASE_URL ?? 'http://localhost:3001';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });

await page.goto(base + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await page.fill('#email', email);
await page.fill('#password', password);
await page.click('button[type="submit"]');
try {
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
} catch {
  console.error('still on login; page text:', (await page.textContent('body'))?.slice(0, 300));
}
await page.waitForTimeout(1200);

await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out, '→', page.url());
