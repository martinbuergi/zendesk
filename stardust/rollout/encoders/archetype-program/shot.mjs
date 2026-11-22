// Full-page screenshot: node shot.mjs <url> <out.png> <width> [waitMs]
import pw from '/app/node_modules/playwright/index.js';
const { chromium } = pw;
const [url, out, w, wait] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errs.push(String(e)));
await p.waitForTimeout(Number(wait || 1500));
const h = await p.evaluate(() => document.documentElement.scrollHeight);
await p.screenshot({ path: out, fullPage: true });
console.log('height', h, 'errors', JSON.stringify(errs));
await b.close();
