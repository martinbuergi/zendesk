// node sections.mjs <url> <width> <selector-for-sections>
import pw from '/app/node_modules/playwright/index.js';
const { chromium } = pw;
const [url, w, sel] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: 900 } });
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(1200);
const r = await p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => {
  const r0 = e.getBoundingClientRect();
  return `${(e.id || e.className).slice(0, 40).padEnd(40)} top ${Math.round(r0.top + scrollY)} h ${Math.round(r0.height)}`;
}), sel);
console.log(r.join('\n'));
await b.close();
