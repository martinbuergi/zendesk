// Sibling builder for the `program` template (archetype: service).
// Forks the gated archetype prototype (stardust/prototypes/service-proposed.html: head, canon chrome,
// sv- module vocabulary) and injects each sibling's content verbatim from its hydrated capture
// (stardust/current/pages/<slug>.html + .json). Each live top-level section is carried with the
// closest archetype module (sv-hero, sv-promo, sv-accordion, sv-stories, sv-cards, sv-links,
// sv-embed, sv-columns, sv-carousel, sv-cta, sv-form); compositions the archetype lacks are emitted
// as a VARIANT class on that module and logged. Content is serialized from the capture DOM in
// order (headings, paragraphs, lists, links, buttons, images, media, forms), never re-written.
// program-2 additions (variants, not forks): legacy one-section pages split into hero + heading rows;
// `sv-cards tiles` (linked image+heading tiles without card chrome); `sv-links subnav` (leading
// microsite/landing header bar, mobile/desktop copies deduped); in-main global footer dropped as a
// duplicate of the canon footer when its links are a subset; `data-modal-ssr-content` wrappers →
// sv-form modal id=<name>, or a section with the `modal` variant + data-modal=<name>.
//
// Usage: node build.mjs <slug…> [--out stardust/.work/render/program] [--proto stardust/prototypes/service-proposed.html]
// Writes <out>/<slug>.html (driver --source input) and <out>/<slug>.report.json
// (modules, variants, sections, deviations) for the sidecar judgments.
import * as cheerio from '/app/node_modules/cheerio/dist/esm/index.js';
import fs from 'fs';
import path from 'path';

const ROOT = '/workspace/3055ed88';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const OUT = path.resolve(ROOT, opt('--out', 'stardust/.work/render/program'));
const PROTO = path.resolve(ROOT, opt('--proto', 'stardust/prototypes/service-proposed.html'));
const slugs = args;
if (!slugs.length) { console.error('usage: node build.mjs <slug…> [--out dir] [--proto file]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = (s) => esc(s).replace(/"/g, '&quot;');
const cls = (el) => (el.attribs && el.attribs.class) || '';
const has = (el, k) => cls(el).includes(k);
const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'code', 'small', 'u', 's']);
const SKIP = new Set(['script', 'style', 'noscript', 'svg', 'template', 'canvas', 'link', 'meta', 'path']);
const BLOCKISH = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'figure', 'form',
  'iframe', 'video', 'table', 'div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'cite', 'fieldset', 'dl']);
const KEEP_ATTR = ['href', 'target', 'rel', 'aria-label', 'title'];

function realImg($, el) {
  const src = el.attribs.src || '';
  if (el.attribs['aria-hidden'] === 'true' && src.startsWith('data:')) return null; // next/image sizer
  if (src && !src.startsWith('data:') && !src.startsWith('blob:')) return { src, alt: el.attribs.alt ?? '' };
  // lazy next/image: real src lives in the sibling <noscript>
  const ns = $(el).nextAll('noscript').first();
  if (ns.length) {
    const t = ns.text() || ns.html() || '';
    const m = t.match(/src="([^"]+)"/);
    if (m) return { src: m[1].replace(/&amp;/g, '&'), alt: el.attribs.alt ?? '' };
  }
  return null;
}

function attrs(el, keys) {
  return keys.filter((k) => el.attribs[k] != null).map((k) => ` ${k}="${escA(el.attribs[k])}"`).join('');
}

// ---------------------------------------------------------------- serializer
function makeSerializer($, ctx) {
  const ser = (node) => {
    if (node.type === 'text') return esc(node.data.replace(/\s+/g, ' '));
    if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') return '';
    const el = node; const tag = el.tagName.toLowerCase();
    if (SKIP.has(tag)) return '';
    const c = cls(el);
    if (/AccordionMediaMobile/.test(c)) { ctx.note('dedupe', 'AccordionMediaMobile duplicate image set (mobile copy of the desktop media)'); return ''; }
    if (/wistia_embed/.test(c)) return wistia(el);
    if (/(^|\s)slick-slide(\s|$)/.test(c)) {
      const di = el.attribs['data-index'];
      const track = $(el).parent()[0];
      if (!ctx.slides.has(track)) {
        const all = $(track).children('[class*="slick-slide"]').map((i, x) => Number(x.attribs['data-index'])).get();
        const neg = all.filter((x) => x < 0).length;
        ctx.slides.set(track, { seen: new Set(), n: neg ? all.length - 2 * neg : all.length });
      }
      const tr = ctx.slides.get(track);
      if (/slick-cloned/.test(c) || (di != null && (Number(di) < 0 || Number(di) >= tr.n || tr.seen.has(di)))) { ctx.note('dedupe', 'slick clone slide (carousel loop copy)'); return ''; }
      if (di != null) tr.seen.add(di);
    }
    if (/slick-arrow/.test(c)) return ''; // carousel UI control
    const item = ctx.itemOf(el);
    const inner = () => el.children.map(ser).join('');
    let out;
    if (/^h[1-6]$/.test(tag)) out = `<${tag}>${inner().trim()}</${tag}>`;
    else if (tag === 'p') { const t = inner().trim(); out = t ? `<p>${t}</p>` : ''; }
    else if (tag === 'ul' || tag === 'ol' || tag === 'li' || tag === 'blockquote' || tag === 'cite' || tag === 'figure' || tag === 'figcaption' || tag === 'dl' || tag === 'dt' || tag === 'dd' || tag === 'table' || tag === 'thead' || tag === 'tbody' || tag === 'tr' || tag === 'td' || tag === 'th') {
      const t = inner().trim(); out = t ? `<${tag}>${t}</${tag}>` : '';
    } else if (INLINE.has(tag)) out = tag === 'br' ? '<br>' : `<${tag}>${inner()}</${tag}>`;
    else if (tag === 'a' && ctx.seenLinks && ctx.seenLinks.has(`${$(el).text().replace(/\s+/g, ' ').trim()}|${el.attribs['aria-label'] || ''}|${el.attribs.href || ''}|${$(el).find('img').attr('src') || ''}`)) {
      ctx.note('dedupe', 'subnav link repeated by the mobile/desktop header copies'); out = '';
    } else if (tag === 'a') {
      if (ctx.seenLinks) ctx.seenLinks.add(`${$(el).text().replace(/\s+/g, ' ').trim()}|${el.attribs['aria-label'] || ''}|${el.attribs.href || ''}|${$(el).find('img').attr('src') || ''}`);
      const t = (hasBlockDesc(el) ? blockWrap(el.children, ser) : inner()).replace(/\s+/g, ' ').trim();
      out = (t || el.attribs['aria-label']) ? `<a${attrs(el, KEEP_ATTR)}>${t}</a>` : '';
    } else if (tag === 'button') {
      if ($(el).find('h1,h2,h3,h4,h5,h6').length) out = inner(); // accordion header: carry the heading
      else {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        const al = el.attribs['aria-label'] || '';
        if (t) out = `<button type="${el.attribs.type === "submit" ? "submit" : "button"}"${attrs(el, ["aria-label", "role"])}>${esc(t)}</button>`;
        else if (/video/i.test(al)) out = `<button class="sv-play" type="button" aria-label="${escA(al)}"></button>`;
        else { ctx.note('ui', `icon-only control "${al}" (module chrome supplied by the sv- block)`); out = ''; }
      }
    } else if (tag === 'img') {
      const r = realImg($, el);
      out = r ? `<img src="${escA(r.src)}" alt="${escA(r.alt)}"${attrs(el, ['width', 'height'])}>` : '';
    } else if (tag === 'iframe') out = `<iframe${attrs(el, ['src', 'title', 'name', 'allow'])} loading="lazy"></iframe>`;
    else if (tag === 'video') out = video(el);
    else if (tag === 'form') out = `<form${attrs(el, ['id'])} action="#" novalidate>${inner()}</form>`;
    else if (tag === 'input') out = (el.attribs.type === 'hidden') ? '' : `<input${attrs(el, ['type', 'name', 'id', 'placeholder', 'aria-label', 'required', 'autocomplete', 'value'])}>`;
    else if (tag === 'textarea') out = `<textarea${attrs(el, ['name', 'id', 'placeholder', 'aria-label', 'required'])}></textarea>`;
    else if (tag === 'select') out = `<select${attrs(el, ['name', 'id', 'aria-label', 'required'])}>${inner()}</select>`;
    else if (tag === 'option') out = `<option${attrs(el, ['value'])}>${esc($(el).text().trim())}</option>`;
    else if (tag === 'label') { const t = inner().trim(); out = t ? `<label${attrs(el, ['for'])}>${t}</label>` : ''; }
    else if (el.attribs.role === 'tab') out = `<button type="button" role="tab">${esc($(el).text().trim())}</button>`;
    else if (el.attribs.role === 'tablist') out = `<div class="sv-tabs__list" role="tablist">${inner()}</div>`;
    else if (el.attribs.role === 'tabpanel') out = `<div class="sv-tabs__panel" role="tabpanel">${inner()}</div>`;
    else if (tag === 'span' || tag === 'label') out = inner();
    else out = blockWrap(el.children, ser); // div/section/etc: unwrap; loose text runs become <p>
    if (item && out) out = `<div class="${item}">${out}</div>`;
    return out;
  };
  // children of a wrapper: text/inline runs → <p>, block children serialized as-is
  const blockWrap = (children, s) => {
    const parts = []; let run = '';
    const flush = () => { if (run.replace(/<[^>]+>/g, '').trim() || /<img|<button/.test(run)) parts.push(/^\s*<(img|button|a )/.test(run) && !run.replace(/<[^>]+>/g, '').trim() ? run : `<p>${run.trim()}</p>`); run = ''; };
    const hasText = children.some((ch) => ch.type === 'text' && ch.data.trim());
    for (const ch of children) {
      if (hasText && ch.type === 'tag' && ch.tagName === 'a' && !hasBlockDesc(ch)) { run += s(ch); continue; }
      const isBlock = ch.type === 'tag' && (BLOCKISH.has(ch.tagName.toLowerCase()) || ch.attribs.role === 'tab' || ch.attribs.role === 'tablist' || ch.attribs.role === 'tabpanel'
        || (ch.tagName === 'a' && hasBlockDesc(ch)) || (ch.tagName === 'span' && hasBlockDesc(ch)) || ['img', 'button', 'input', 'select', 'textarea', 'label'].includes(ch.tagName));
      if (ch.type === 'tag' && ch.tagName === 'a' && !hasBlockDesc(ch)) { flush(); const a = s(ch); if (a) parts.push(a.startsWith('<div') ? a : `<p>${a}</p>`); } else if (isBlock) { flush(); parts.push(s(ch)); } else run += s(ch);
    }
    flush();
    return parts.join('');
  };
  const hasBlockDesc = (el) => (el.children || []).some((c) => c.type === 'tag' && (BLOCKISH.has(c.tagName) || c.tagName === 'img' || hasBlockDesc(c)));
  const wistia = (el) => {
    const src = $(el).find('source[src*="wistia"]').attr('src') || '';
    const id = (src.match(/medias\/([a-z0-9]+)/) || [])[1] || (cls(el).match(/wistia_async_([a-z0-9]+)/) || [])[1] || (el.attribs.id || '').replace(/^wistia-player-/, '');
    if (/popover=true/.test(cls(el)) && !$(el).find('.w-chrome').length) return `<div class="sv-video popover" data-video="wistia:${id}">${blockWrap(el.children, ser)}</div>`;
    const label = $(el).find('video').attr('aria-label') || '';
    const th = $(el).find('img').filter((i, x) => /wistia/.test(x.attribs.src || '')).first();
    ctx.note('dropped', `Wistia player chrome (controls, "Press O for more options", "Click for sound") — the embed re-instantiates it (video ${id})`);
    return `<div class="sv-video" data-video="wistia:${id}">${th.length ? `<img src="${escA(th.attr('src'))}" alt="${escA(th.attr('alt') || '')}">` : ''}<button class="sv-play" type="button" aria-label="${escA(label ? `Play Video: ${label}` : 'Play video')}"></button></div>`;
  };
  const video = (el) => {
    const s = [el.attribs.src, ...$(el).find('source').map((i, x) => x.attribs.src).get()].find((u) => u && !u.startsWith('blob:'));
    if (!s) return '';
    return `<video src="${escA(s)}" muted playsinline loop${el.attribs.poster && !/blank\.gif/.test(el.attribs.poster) ? ` poster="${escA(el.attribs.poster)}"` : ''}${attrs(el, ['aria-label'])}></video>`;
  };
  return ser;
}

// ---------------------------------------------------------------- units + classification
function units($) {
  const main = $('main').first();
  const out = []; let loose = [];
  const isUnit = (el) => el.tagName === 'section' || has(el, 'Tabsstyle__TabsRoot') || has(el, 'StyledTabs');
  const containsUnit = (el) => $(el).find('section,[class*="Tabsstyle__TabsRoot"],[class*="StyledTabs"]').length > 0;
  const flushLoose = () => { if (loose.length) out.push({ els: loose, loose: true }); loose = []; };
  // in-main site footer (landing/microsite pages render the global footer inside <main>)
  const isFooter = (el) => el.tagName === 'footer' || ($(el).children().length === 1 && $(el).children('footer').length === 1);
  // legacy one-section pages (Basestyle): a section holding the h1 grid AND further grids with
  // heading rows is split into hero + one unit per heading row (each rides its own module)
  const split = (sec) => {
    const cont = $(sec).children('[class*="Containerstyle__ContainerRoot"]').first();
    const grids = cont.children('[class*="Gridstyle__GridRoot"]');
    if (!/Basestyle__BaseRoot/.test(cls(sec)) || !$(sec).find('h1').length || grids.length < 2
      || !grids.filter((i, g) => !$(g).find('h1').length && $(g).children('[class*="Gridstyle__Row"]').filter((j, r) => $(r).find('h2').length).length >= 2).length) return [{ els: [sec] }];
    const parts = [];
    cont.children().each((i, g) => {
      if (!$(g).text().trim() && !$(g).find('img,iframe,video,form').length) return;
      const rows = $(g).children('[class*="Gridstyle__Row"]').filter((j, r) => $(r).find('h1,h2,h3,h4,h5,h6').length);
      if (!$(g).find('h1').length && rows.length >= 2) rows.each((j, r) => parts.push({ els: [r], legacy: true }));
      else parts.push({ els: [g], legacy: true });
    });
    return parts;
  };
  const walk = (el) => {
    for (const ch of el.children) {
      if (ch.type !== 'tag') { if (ch.type === 'text' && ch.data.trim()) loose.push(ch); continue; }
      if (SKIP.has(ch.tagName)) continue;
      const modal = ch.attribs['data-modal-ssr-content'];
      if (modal) { flushLoose(); out.push({ els: [ch], loose: !containsUnit(ch), modal }); continue; }
      if (isFooter(ch)) { flushLoose(); out.push({ els: [ch], chrome: 'footer' }); continue; }
      if (isUnit(ch)) { flushLoose(); out.push(...split(ch)); } else if (containsUnit(ch)) walk(ch); else loose.push(ch);
    }
  };
  walk(main[0]);
  flushLoose();
  // leading heading-less loose run (microsite/landing header bar: logo + nav + CTAs) → subnav unit
  if (out[0] && out[0].loose && !out[0].modal && !out[0].els.some((e) => e.type === 'tag' && $(e).find('h1,h2,h3,h4,h5,h6').length)
    && out[0].els.some((e) => e.type === 'tag' && $(e).find('a[href]').length)) out[0].subnav = true;
  return out;
}

function classify($, u, idx, n) {
  const q = (s) => u.els.reduce((a, e) => a + $(e).find(s).length + ($(e).is(s) ? 1 : 0), 0);
  const txt = u.els.map((e) => $(e).text()).join(' ').replace(/\s+/g, ' ').trim();
  const imgs = u.els.reduce((a, e) => a + $(e).find('img').filter((i, x) => !(x.attribs['aria-hidden'] === 'true')).length, 0);
  const links = q('a[href]');
  const v = [];
  if (u.chrome) return { mod: 'sv-links', v: ['footer'] };
  if (u.subnav) return { mod: 'sv-links', v: ['subnav'] };
  if (u.loose && q('form') && q('input,select,textarea') > 3) return { mod: 'sv-form', v: ['modal'] };
  if (q('h1')) {
    if (q('form')) v.push('trial');
    if (q('[class*="wistia_embed"],video,[class*="Video"]')) v.push('video');
    else if (imgs) v.push('image'); else v.push('text');
    if (q('[class*="LogotypeRow"]')) v.push('logos');
    return { mod: 'sv-hero', v };
  }
  if (q('[class*="Tabsstyle__TabsRoot"],[class*="StyledTabs"]')) return { mod: 'sv-columns', v: ['tabs'] };
  if (q('[class*="Accordionstyle__AccordionRoot"]')) {
    if (!q('[class*="AccordionMedia"] img, [class*="Accordionstyle__AccordionMedia"] img') && !imgs) v.push('faq');
    if (q('[class*="Relationframe"]')) v.push('intro');
    return { mod: 'sv-accordion', v };
  }
  if (q('blockquote,[class*="Quotestyle__QuoteRoot"]')) {
    if (q('[class*="LogotypeRow"]')) v.push('logos');
    if (!q('[class*="slick-slide"]')) v.push('single');
    return { mod: 'sv-stories', v };
  }
  if (q('[class*="slick-slide"]') || q('[aria-roledescription="carousel"]')) return { mod: 'sv-carousel', v };
  if (q('iframe')) return { mod: 'sv-embed', v: q('h3') ? ['split'] : [] };
  if (q('[class*="LogotypeRow"]')) return { mod: 'sv-cards', v: ['logos'] };
  const cards = q('[class*="Cardstyle__CardRoot"],[class*="Cardstyle__LinkCardRoot"]');
  if (cards >= 2) {
    if (q('[class*="Statstyle__StatRoot"]')) v.push('stats');
    if (/\$\d/.test(txt) && /\/month|\/mo/i.test(txt)) v.push('plans');
    if (q('[class*="LinkGroup"] a[href]') && cards >= 4 && imgs >= 4 && /partner/i.test(txt)) v.push('media');
    return { mod: 'sv-cards', v };
  }
  if (q('[class*="Statstyle__StatRoot"]')) return { mod: 'sv-cards', v: ['stats'] };
  // linked media tiles without card chrome (legacy episode/resource grids): image + heading per <a>
  const tiles = u.els.reduce((a, e) => a + $(e).find('a[href]').filter((i, x) => $(x).find('img').length && $(x).find('h3,h4,h5,h6').length).length, 0);
  if (!cards && tiles >= 3) return { mod: 'sv-cards', v: ['tiles'] };
  if (q('[class*="LinkGroupstyle"] a[href]') >= 4 && !imgs) return { mod: 'sv-links', v };
  if (q('[class*="wistia_embed"],video')) return { mod: 'sv-embed', v: ['video'] };
  if (idx >= n - 2 && links <= 2 && imgs <= 1 && q('h2') && txt.length < 300) return { mod: 'sv-cta', v: imgs ? ['image'] : [] };
  if (imgs === 1 && q('h2,h3') && links <= 1 && cards <= 1 && /Promo|body-promo/.test(u.els.map((e) => $.html(e)).join('').slice(0, 4000))) return { mod: 'sv-promo', v };
  if (cards === 1 && q('h3') >= 2) return { mod: 'sv-columns', v };
  if (imgs >= 1) return { mod: 'sv-columns', v: ['media'] };
  return { mod: 'sv-columns', v: q('h2') > 1 ? ['text', 'multi'] : ['text'] };
}

const ITEM = {
  'sv-accordion': [/Accordionstyle__AccordionSection/, 'sv-acc__item'],
  'sv-cards': [/Cardstyle__CardRoot|Cardstyle__LinkCardRoot|Statstyle__StatRoot|LogotypeRowstyle__Logo(?!type|Arrow)/, 'sv-card'],
  'sv-stories': [/Quotestyle__QuoteRoot|(^|\s)slick-slide(\s|$)|Statstyle__StatRoot/, 'sv-story'],
  'sv-carousel': [/(^|\s)slick-slide(\s|$)/, 'sv-res__slide'],
  'sv-links': [/LinkGroupstyle__LinkGroupRoot/, 'sv-caps'],
  'sv-hero': [/LogotypeRowstyle__Logo(?!type|Arrow)/, 'sv-hero__logo'],
};

// ---------------------------------------------------------------- page build
const proto = fs.readFileSync(PROTO, 'utf8');
const pMainStart = proto.indexOf('<main');
const pMainOpenEnd = proto.indexOf('>', pMainStart) + 1;
const pMainEnd = proto.indexOf('</main>');
// canon footer link set (normalized) — an in-main footer whose links all appear here is chrome duplicate
const normH = (h) => String(h || '').replace(/&amp;/g, '&').replace(/^https:\/\/www\.zendesk\.com(?=\/)/, '');
const canonFooterHrefs = new Set([...proto.slice(pMainEnd).matchAll(/href="([^"]*)"/g)].map((m) => normH(m[1])));

for (const slug of slugs) {
  const capHtml = fs.readFileSync(path.join(ROOT, `stardust/current/pages/${slug}.html`), 'utf8');
  const cap = JSON.parse(fs.readFileSync(path.join(ROOT, `stardust/current/pages/${slug}.json`), 'utf8'));
  const $ = cheerio.load(capHtml);
  const notes = new Map();
  const report = { slug, template: 'service', archetypeSource: 'service', sections: [], modules: [], variants: [], deviations: [] };
  const us = units($).filter((u) => u.els.some((e) => (e.type === 'text' ? e.data.trim() : ($(e).text().trim() || $(e).find('img,iframe,video,form').length))));
  const secs = [];
  us.forEach((u, i) => {
    const { mod, v } = classify($, u, i, us.length);
    // variance probe (variance.json): the legacy page family (Basestyle sections: proxima nova, tinted
    // hero 174/64 padding, padded tinted cards) is a second visual family → `legacy` variant per module
    if (u.legacy || u.els.some((e) => e.type === 'tag' && /Basestyle__BaseRoot/.test(cls(e)))) v.push('legacy');
    if (u.modal && mod !== 'sv-form') v.push('modal'); // modal-detail content (opened by #modal.<name>) carried as a section
    if (u.chrome === 'footer') {
      const hrefs = u.els.flatMap((e) => $(e).find('a[href]').map((j, a) => normH(a.attribs.href)).get());
      const extra = hrefs.filter((h) => h && !canonFooterHrefs.has(h));
      if (!extra.length) {
        const key = `dedupe|in-main global footer (${hrefs.length} links, all present in the canon footer, which supplies it)`;
        notes.set(key, (notes.get(key) || 0) + 1);
        report.sections.push({ i, id: null, module: 'canon-footer', variants: ['chrome'], headings: [] });
        return;
      }
    }
    if (mod === 'sv-cards') {
      const n = u.els.reduce((a, e) => a + $(e).find('[class*="Cardstyle__CardRoot"],[class*="Cardstyle__LinkCardRoot"]').length, 0);
      if (n === 3) v.push('cols-3'); // archetype grid is 4-up (258px cards); 3-up siblings measure 351px
    }
    const [re, itemCls] = ITEM[mod] || [null, null];
    const ctx = {
      unitIdx: i, slides: new Map(), seenLinks: v.includes('subnav') ? new Set() : null,
      note: (k, r) => { const key = `${k}|${r}`; notes.set(key, (notes.get(key) || 0) + 1); },
      itemOf: (el) => {
        if (mod === 'sv-cards' && v.includes('tiles') && el.tagName === 'a' && $(el).find('img').length && $(el).find('h3,h4,h5,h6').length) return 'sv-card';
        if (!re || !re.test(cls(el))) return null;
        // stats nested inside a story slide stay inside the story
        if (mod === 'sv-stories' && /Statstyle/.test(cls(el)) && $(el).closest('[class*="slick-slide"],[class*="Quotestyle__QuoteRoot"]').length) return 'sv-stat';
        if (mod === 'sv-stories' && /Quotestyle__QuoteRoot/.test(cls(el)) && $(el).closest('[class*="slick-slide"]').length) return null;
        if (mod === 'sv-cards' && /Statstyle/.test(cls(el))) return 'sv-stat';
        return itemCls;
      },
    };
    const ser = makeSerializer($, ctx);
    const body = u.els.map(ser).join('').replace(/<p>\s*<\/p>/g, '');
    const id = u.els.find((e) => e.attribs && e.attribs.id)?.attribs.id || (u.modal ? $(u.els).find('section[id]').first().attr('id') : undefined);
    const name = mod.replace('sv-', '');
    const vcls = v.join(' ');
    const attrsS = `${id ? ` id="${escA(id)}"` : ''} class="za-section sv-sec sv-${name}${vcls ? ` ${vcls}` : ''}" data-module="${mod}"${vcls ? ` data-variant="${escA(vcls)}"` : ''}${u.modal && mod !== 'sv-form' ? ` data-modal="${escA(u.modal)}"` : ''}`;
    if (mod === 'sv-form') secs.push(`<div class="sv-modal" id="${escA(u.modal || 'contact-sales')}" role="dialog" aria-modal="true" data-module="sv-form" data-variant="modal" hidden>${body}</div>`);
    else secs.push(`<section${attrsS}>\n  <div class="za-container za-row-gap">${body}</div>\n</section>`);
    report.sections.push({ i, id: id || null, module: mod, variants: v, headings: $(u.els).find('h1,h2,h3').slice(0, 2).map((j, h) => $(h).text().trim()).get() });
    if (!report.modules.includes(mod)) report.modules.push(mod);
    for (const x of v) { const vv = `${mod} ${x}`; if (!report.variants.includes(vv)) report.variants.push(vv); }
  });
  for (const [k, c] of notes) {
    const [kind, reason] = k.split('|');
    if (kind === 'dropped' || kind === 'dedupe') report.deviations.push({ kind: kind === 'dedupe' ? 'deduplicated' : 'dropped', count: c, reason });
  }
  // head: page metadata from the capture (title, description, og, canonical, lang)
  let head = proto.slice(0, pMainStart);
  const lang = $('html').attr('lang') || 'en-US';
  const setMeta = (re, val) => { if (val != null) head = head.replace(re, (m, a, b, c2) => `${a}${escA(val)}${c2 ?? b}`); };
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(cap.title || '')}</title>`);
  setMeta(/(<meta name="description" content=")([^"]*)(")/, cap.description || '');
  setMeta(/(<meta property="og:title" content=")([^"]*)(")/, cap.og?.title ?? cap.title);
  setMeta(/(<meta property="og:description" content=")([^"]*)(")/, cap.og?.description ?? cap.description);
  if (cap.og?.image) setMeta(/(<meta property="og:image" content=")([^"]*)(")/, cap.og.image);
  setMeta(/(<link rel="canonical" href=")([^"]*)(")/, $('link[rel=canonical]').attr('href') || cap.url);
  head = head.replace(/<html lang="[^"]*"/, `<html lang="${escA(lang)}"`);
  const mainOpen = `<main id="main-content" class="za-main sv-main" lang="${escA(lang)}">`;
  const tail = proto.slice(pMainEnd);
  const html = `${head}${mainOpen}\n<div class="sv-wrap">\n${secs.filter((s) => !s.includes('data-module="sv-form"')).join('\n\n')}\n</div>\n${secs.filter((s) => s.includes('data-module="sv-form"')).join('\n')}\n${tail}`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), html);
  fs.writeFileSync(path.join(OUT, `${slug}.report.json`), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${slug}: ${secs.length} sections, modules ${report.modules.join(',')}, variants [${report.variants.join('; ')}]`);
}
