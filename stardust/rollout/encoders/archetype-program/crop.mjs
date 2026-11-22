// node crop.mjs <in.png> <out.png> <y> <h> [scale] — crop+scale via chromium canvas
import pw from '/app/node_modules/playwright/index.js';
import fs from 'node:fs';
const { chromium } = pw;
const [inp, out, y, h, sc] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage();
const data = fs.readFileSync(inp).toString('base64');
const res = await p.evaluate(async ([d, y0, hh, s]) => {
  const img = new Image(); img.src = `data:image/png;base64,${d}`; await img.decode();
  const c = document.createElement('canvas');
  const H = Math.min(hh, img.naturalHeight - y0);
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(H * s);
  c.getContext('2d').drawImage(img, 0, y0, img.naturalWidth, H, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}, [data, Number(y), Number(h), Number(sc || 0.5)]);
fs.writeFileSync(out, Buffer.from(res.split(',')[1], 'base64'));
await b.close();
