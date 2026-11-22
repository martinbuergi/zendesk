// Rehost a program sibling's images: every <img src> in content/<page>.html that is not on the DA
// content host is fetched into <dir>/<slug>/ (Scene7 avif → png-alpha, cdn-cgi f=auto → the
// original format via Accept) and its src rewritten to
// https://content.da.live/aemcoder/3055ed88/media/<slug>/<name>. SVGs over 40 KB (DA 409) and
// fetch failures keep their external URL (media-reconcile `keep`).
// Then upload: da-media-upload.mjs --scope <slug> --dir <dir>/<slug>.
// Usage: node media.mjs <content.html> <slug> [--dir stardust/.work/cluster-program/media]
import fs from 'fs';
import path from 'path';

const [file, slug, ...rest] = process.argv.slice(2);
if (!file || !slug) { console.error('usage: node media.mjs <content.html> <slug> [--dir <dir>]'); process.exit(1); }
const di = rest.indexOf('--dir');
const DIR = path.join(di >= 0 ? rest[di + 1] : 'stardust/.work/cluster-program/media', slug);
const BASE = `https://content.da.live/aemcoder/3055ed88/media/${slug}`;
fs.mkdirSync(DIR, { recursive: true });
let src = fs.readFileSync(file, 'utf8');
const urls = [...new Set([...src.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]))].filter((u) => !u.startsWith(BASE) && /^https?:/.test(u));
const used = new Map();
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
let ok = 0; let kept = 0;
for (const u0 of urls) {
  const u = u0.replace(/&amp;/g, '&');
  let fetchUrl = u.replace(/fmt=avif-alpha/, 'fmt=png-alpha').replace(/fmt=avif\b/, 'fmt=png');
  let res;
  try { res = await fetch(fetchUrl, { headers: { accept: 'image/png,image/jpeg,image/svg+xml;q=0.9,image/webp;q=0.5,*/*;q=0.1', 'user-agent': 'Mozilla/5.0' } }); } catch (e) { res = null; }
  if (!res || !res.ok) { console.log(`KEEP ${u} (fetch ${res ? res.status : 'error'})`); kept += 1; continue; }
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = EXT[type];
  if (!ext || (ext === 'svg' && buf.length > 40000)) { console.log(`KEEP ${u} (${type} ${buf.length} B)`); kept += 1; continue; }
  let base = decodeURIComponent(new URL(u).pathname.split('/').pop()).replace(/\.[a-z0-9]+$/i, '').replace(/[^A-Za-z0-9_-]+/g, '-').toLowerCase() || 'image';
  let name = `${base}.${ext}`; let k = 2;
  while (used.has(name) && used.get(name) !== u) name = `${base}-${k++}.${ext}`;
  used.set(name, u);
  fs.writeFileSync(path.join(DIR, name), buf);
  src = src.split(`src="${u0}"`).join(`src="${BASE}/${name}"`);
  ok += 1;
}
fs.writeFileSync(file, src);
console.log(`media ${slug}: rehosted ${ok}, kept ${kept} → ${DIR}`);
