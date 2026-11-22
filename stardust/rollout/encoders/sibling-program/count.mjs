// Content-count acceptance for program siblings: role-classified sets (headings, body nodes,
// CTAs label+href, images, iframes/videos, form fields) from the capture's <main>
// (stardust/current/pages/<slug>.html; headings cross-checked against <slug>.json) vs a rendered page's <main>.
// Usage: node count.mjs <slug> <rendered.html> [--json]
// Exit 0 = no uncovered drop, 2 = drops listed (each must be fixed or logged as a contentDeviation).
import * as cheerio from '/app/node_modules/cheerio/dist/esm/index.js';
import fs from 'fs';

const ROOT = '/workspace/3055ed88';
let PAGE_FROM = null;
const [slug, rendered, flag] = process.argv.slice(2);
// rendered under stardust/migrated/<path>/index.html → page URL path /<path>/
{ const m = String(rendered || '').match(/migrated\/(.+)\/index\.html$/); if (m) PAGE_FROM = `/${m[1]}/`; }
if (!slug || !rendered) { console.error('usage: node count.mjs <slug> <rendered.html> [--json]'); process.exit(1); }
const norm = (s) => String(s || '').replace(/\s+/g, ' ').replace(/ /g, ' ').trim();
// rendered files from the driver carry migrated-tree relative links (../x/index.html): resolve them
// against the page's URL path (sanctioned internal-link transform) before comparing
let PAGE = '/';
if (PAGE_FROM) PAGE = PAGE_FROM;
const normHref = (h) => {
  let u = String(h || '').trim().replace(/&amp;/g, '&');
  u = u.replace(/^https?:\/\/www\.zendesk\.com(?=\/)/, '');
  if (!/^([a-z]+:|\/|#)/i.test(u)) { const r = new URL(u, `https://x${PAGE}`); u = r.pathname + r.search + r.hash; }
  return u.replace(/\/index\.html(?=$|[?#])/, '/').replace(/\/(?=$|[?#])/, '');
};

function roles(html, isCapture, withFooter) {
  const $ = cheerio.load(html);
  // capture pages that render the global footer inside <main> (landing/microsite family): the build
  // drops it as a chrome duplicate, so the rendered side is compared as <main> + the canon footer
  const main = withFooter ? $('main, body > .za-ftr, body footer').filter((i, e) => !$(e).parents('main').length) : $('main').first();
  if (isCapture) main.find('.w-chrome *').filter((i, e) => !/^(img|source|video)$/.test(e.tagName)).each((i, e) => { if (e.tagName !== 'img') $(e).attr('data-cc-skip', '1'); });
  const skip = (e) => $(e).closest('[data-cc-skip],script,style,noscript,template').length > 0;
  const R = { headings: new Set(), body: new Set(), ctas: new Set(), images: new Set(), media: new Set(), fields: new Set() };
  main.find('img').each((i, e) => {
    let src = $(e).attr('src') || '';
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      if ($(e).attr('aria-hidden') === 'true') return;
      const ns = $(e).nextAll('noscript').first(); const m = (ns.text() || ns.html() || '').match(/src="([^"]+)"/);
      if (!m) return; src = m[1];
    }
    if (/blank\.gif/.test(src)) return;
    R.images.add(src.replace(/&amp;/g, '&'));
  });
  main.find('noscript').remove();
  main.find('h1,h2,h3,h4,h5,h6').each((i, e) => { if (!skip(e)) { const t = norm($(e).text()); if (t) R.headings.add(t); } });
  main.find('p,li,blockquote,td,dd,label').each((i, e) => {
    if (skip(e) || $(e).find('p,li,blockquote').length) return;
    const t = norm($(e).text()); if (t && !/^h[1-6]$/.test(e.tagName)) R.body.add(t);
  });
  main.find('a[href]').each((i, e) => { if (!skip(e)) { const t = norm($(e).text()) || norm($(e).attr('aria-label')); if (t) R.ctas.add(`${t.replace(/\s+/g, "")} → ${normHref($(e).attr('href'))}`); } });
  main.find('iframe[src]').each((i, e) => R.media.add(`iframe ${$(e).attr('src')}`));
  main.find('video').each((i, e) => { const s = [$(e).attr('src'), ...$(e).find('source').map((j, x) => $(x).attr('src')).get()].find((u) => u && !u.startsWith('blob:') && !/\.m3u8$/.test(u)); if (s) R.media.add(`video ${s}`); });
  main.find('source[src*="wistia"]').each((i, e) => { const m = ($(e).attr('src') || '').match(/medias\/([a-z0-9]+)/); if (m) R.media.add(`wistia ${m[1]}`); });
  main.find('[class*="wistia_async_"]').each((i, e) => R.media.add(`wistia ${($(e).attr('class').match(/wistia_async_([a-z0-9]+)/) || [])[1]}`));
  main.find('[data-video^="wistia:"]').each((i, e) => R.media.add(`wistia ${$(e).attr('data-video').slice(7)}`));
  main.find('input,select,textarea').each((i, e) => { if ($(e).attr('type') !== 'hidden') R.fields.add(`${e.tagName} ${$(e).attr('name') || ''} ${$(e).attr('placeholder') || ''}`.trim()); });
  return R;
}

const capHtml = fs.readFileSync(`${ROOT}/stardust/current/pages/${slug}.html`, 'utf8');
const cap = roles(capHtml, true);
const ren = roles(fs.readFileSync(rendered, 'utf8'), false, cheerio.load(capHtml)('main footer').length > 0);
const json = JSON.parse(fs.readFileSync(`${ROOT}/stardust/current/pages/${slug}.json`, 'utf8'));
const out = { slug, counts: {}, missing: {}, extra: {} };
for (const k of Object.keys(cap)) {
  out.counts[k] = { capture: cap[k].size, rendered: ren[k].size };
  out.missing[k] = [...cap[k]].filter((x) => !ren[k].has(x));
  out.extra[k] = [...ren[k]].filter((x) => !cap[k].has(x));
}
// cross-check: JSON headings that live in the capture main must be in the render
out.jsonHeadingsInMain = json.headings.filter((h) => cap.headings.has(norm(h.text))).length;
out.jsonHeadingsMissing = json.headings.filter((h) => cap.headings.has(norm(h.text)) && !ren.headings.has(norm(h.text))).map((h) => h.text);
const drops = Object.values(out.missing).reduce((a, l) => a + l.length, 0) + out.jsonHeadingsMissing.length;
out.drops = drops;
if (flag === '--json') console.log(JSON.stringify(out, null, 2));
else {
  console.log(`${slug}: ${Object.entries(out.counts).map(([k, v]) => `${k} ${v.rendered}/${v.capture}`).join(' · ')} · json-headings ${out.jsonHeadingsInMain - out.jsonHeadingsMissing.length}/${out.jsonHeadingsInMain} · drops ${drops}`);
  for (const [k, l] of Object.entries(out.missing)) for (const x of l) console.log(`  MISSING ${k}: ${x.slice(0, 160)}`);
}
process.exit(drops ? 2 : 0);
