// Decode AVIF files with Chromium (no native converter on this box) and write lossless PNGs
// (alpha kept) or WebP (opaque photos, q 0.95). Usage: node avif2png.mjs <srcDir> <outDir>
import pw from '/app/node_modules/playwright/index.js';
const { chromium } = pw;
import fs from 'node:fs';
import path from 'node:path';

const [src, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
for (const f of fs.readdirSync(src)) {
  const full = path.join(src, f);
  if (!f.endsWith('.avif')) {
    fs.copyFileSync(full, path.join(out, f));
    console.log('copy', f);
    continue;
  }
  const b64 = fs.readFileSync(full).toString('base64');
  const res = await page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/avif;base64,${data}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let alpha = false;
    for (let i = 3; i < px.length; i += 4) if (px[i] < 255) { alpha = true; break; }
    const type = alpha ? 'image/png' : 'image/webp';
    const url = c.toDataURL(type, 0.95);
    return { alpha, url, w: c.width, h: c.height };
  }, b64);
  const ext = res.alpha ? 'png' : 'webp';
  const name = f.replace(/\.avif$/, `.${ext}`);
  fs.writeFileSync(path.join(out, name), Buffer.from(res.url.split(',')[1], 'base64'));
  console.log('conv', f, '->', name, `${res.w}x${res.h}`);
}
await browser.close();
