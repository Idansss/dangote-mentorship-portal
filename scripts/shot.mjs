// Quick screenshot helper for visual review during the Stitch redesign.
// Usage: node scripts/shot.mjs <path> <outfile> [width] [height]
// e.g.   node scripts/shot.mjs / stitch-designs/_live-home.png 1280 1800
import { chromium } from 'playwright';

const path = process.argv[2] ?? '/';
const out = process.argv[3] ?? 'shot.png';
const width = Number(process.argv[4] ?? 1280);
const height = Number(process.argv[5] ?? 1800);
const base = process.env.BASE_URL ?? 'http://localhost:3000';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('saved', out);
