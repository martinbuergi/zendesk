// node boxes.mjs <url> <width> <sel1> <sel2> ... → top/height/width of first match
import pw from '/app/node_modules/playwright/index.js';
const { chromium } = pw;
const [url, w, ...sels] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: 900 } });
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(1200);
const r = await p.evaluate((ss) => ss.map((s) => {
  const e = document.querySelector(s);
  if (!e) return `${s}: -`;
  const r0 = e.getBoundingClientRect();
  return `${s}: top ${Math.round(r0.top + scrollY)} h ${Math.round(r0.height)} w ${Math.round(r0.width)} x ${Math.round(r0.left)}`;
}), sels);
console.log(r.join('\n'));
await b.close();
