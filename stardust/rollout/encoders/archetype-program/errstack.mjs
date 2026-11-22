import pw from '/app/node_modules/playwright/index.js';
const b = await pw.chromium.launch(); const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.stack));
await p.goto(process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await b.close();
