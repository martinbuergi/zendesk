// node side.mjs a.png b.png out.png — side-by-side
import pw from '/app/node_modules/playwright/index.js';
import fs from 'node:fs';
const { chromium } = pw;
const [a, bb, out] = process.argv.slice(2);
const br = await chromium.launch();
const p = await br.newPage();
const res = await p.evaluate(async ([d1, d2]) => {
  const load = async (d) => { const i = new Image(); i.src = `data:image/png;base64,${d}`; await i.decode(); return i; };
  const i1 = await load(d1); const i2 = await load(d2);
  const c = document.createElement('canvas');
  c.width = i1.naturalWidth + i2.naturalWidth + 10; c.height = Math.max(i1.naturalHeight, i2.naturalHeight);
  const x = c.getContext('2d'); x.fillStyle = '#f00'; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(i1, 0, 0); x.drawImage(i2, i1.naturalWidth + 10, 0);
  return c.toDataURL('image/png');
}, [fs.readFileSync(a).toString('base64'), fs.readFileSync(bb).toString('base64')]);
fs.writeFileSync(out, Buffer.from(res.split(',')[1], 'base64'));
await br.close();
