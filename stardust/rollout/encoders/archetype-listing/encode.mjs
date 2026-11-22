#!/usr/bin/env node
// archetype-listing ENCODER: a blog listing page (migrated or prototype HTML with the bl-* replica DOM)
// -> DA content document (bl-subnav, bl-hero, bl-group x N, bl-guides, hp-teaser, bl-latest + metadata).
//
// Usage:
//   node encode.mjs --in stardust/migrated/blog/index.html --page /blog/ --scope blog \
//     --media-dir stardust/.work/archetype-listing/media --out content/blog.html
//   --in         migrated page (relative ../ links, ../assets/ images) or the gated prototype
//   --page       the live path of the page (resolves relative hrefs, sets canonical)
//   --scope      DA media folder (images authored as content.da.live/<org>/<repo>/media/<scope>/<file>)
//   --media-dir  dir of the converted (avif -> webp/png) images that were uploaded to that scope;
//                an image is matched by file stem, so foo.avif -> foo.webp
//   --meta       optional _meta.json sidecar (title/description/canonical); default <in dir>/_meta.json
// Sections absent from a sibling page are skipped (category pages carry fewer groups, no picks, etc.).
// A _meta.json with fidelityTier "sibling" (hubs and directories of the listing cluster) is encoded by
// sibling.mjs (section walk, block variants, sections.json band colours and chrome).
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from '/app/node_modules/cheerio/dist/esm/index.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
  return acc;
}, []));
const ROOT = '/workspace/3055ed88';
const Z = 'https://www.zendesk.com';
const MEDIA = `https://content.da.live/aemcoder/3055ed88/media/${args.scope}/`;
const pagePath = args.page || '/blog/';
const src = fs.readFileSync(args.in, 'utf8');
const metaFile = args.meta || path.join(path.dirname(args.in), '_meta.json');
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')).metadata || {} : {};
const metaFull = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
if (metaFull.fidelityTier === 'sibling') {
  // template siblings (hubs, directories): see sibling.mjs
  const { default: encodeSibling } = await import('./sibling.mjs');
  encodeSibling(args, meta, metaFull);
  process.exit(0);
}
const mediaFiles = args['media-dir'] && fs.existsSync(args['media-dir']) ? fs.readdirSync(args['media-dir']) : [];
const PLAN = new Set(JSON.parse(fs.readFileSync(`${ROOT}/stardust/.labs/site-plan.json`, 'utf8'))
  .pages.filter((p) => p.selected).map((p) => p.url));
const D5 = ['/login/', '/register/'];

const $ = cheerio.load(src, { decodeEntities: false });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const txt = (node) => $(node).clone().find('svg').remove().end().text().replace(/\s+/g, ' ').trim();
// inner HTML of a text node keeping only em/strong/br (brand "<em>Zendesk</em>&nbsp;Blog")
const rich = (node) => {
  const c = $(node).clone();
  c.find('svg').remove();
  c.find('*').each((_, e) => { if (!['em', 'strong', 'br'].includes(e.tagName)) $(e).replaceWith($(e).contents()); });
  return c.html().replace(/\s+/g, ' ').trim();
};

function href(h) {
  if (!h || h === '#') return '#';
  let u = new URL(h, Z + pagePath.replace(/\/?$/, '/index.html'));
  if (u.origin === Z) {
    u = new URL(u.href.replace(/index\.html(?=$|[?#])/, ''));
    const abs = u.href;
    if (PLAN.has(abs.split(/[?#]/)[0]) && !D5.some((d) => u.pathname.endsWith(d))) return u.pathname + u.search + u.hash;
    return abs;
  }
  return u.href;
}
function img(node) {
  const el = $(node).is('img') ? $(node) : $(node).find('img').first();
  if (!el.length) return '';
  const base = path.basename(el.attr('src').split('?')[0]);
  const stem = base.replace(/\.[a-z0-9]+$/i, '');
  const file = mediaFiles.find((f) => f === base) || mediaFiles.find((f) => f.replace(/\.[a-z0-9]+$/i, '') === stem) || base;
  return `<p><img src="${MEDIA}${file}" alt="${attr(el.attr('alt') || '')}"></p>`;
}
const block = (name, rows) => [`<div class="${name}">`,
  ...rows.map((r) => `<div>${r.map((c) => `<div>${c}</div>`).join('')}</div>`), '</div>'].join('\n');
const link = (a, inner) => `<a href="${attr(href($(a).attr('href')))}">${inner ?? esc(txt(a))}</a>`;

const sections = [];

// 1 sub-nav: brand + category list (nested sub-menus)
const nav = $('.bl-subnav--desktop').first().length ? $('.bl-subnav--desktop').first() : $('.bl-subnav').first();
if (nav.length) {
  const brand = nav.find('.bl-brand').first();
  const rows = [[`<p>${link(brand, rich(brand.find('span').first().length ? brand.find('span').first() : brand))}</p>`]];
  const items = nav.find('.bl-subnav__item');
  if (items.length) {
    const lis = items.toArray().map((it) => {
      const top = $(it).find('.bl-subnav__link').first();
      const subs = $(it).find('.bl-subnav__menu a').toArray().map((a) => `<li>${link(a)}</li>`).join('');
      return `<li>${link(top)}${subs ? `<ul>${subs}</ul>` : ''}</li>`;
    });
    rows.push([`<ul>${lis.join('')}</ul>`]);
  }
  sections.push(block('bl-subnav', rows));
}

// 2 hero: lead story | picks head (h1 sticker + h2) | picks | subscribe
const hero = $('.bl-hero').first();
if (hero.length) {
  const rows = [];
  hero.find('.bl-lead').each((_, l) => {
    const a = $(l).find('a').first();
    const title = $(l).find('.bl-lead__title').first();
    const desc = $(l).find('.bl-lead__desc').first();
    rows.push([img(l), `<h3>${link(a, esc(txt(title)))}</h3>${desc.length ? `<p>${esc(txt(desc))}</p>` : ''}`]);
  });
  const picks = hero.find('.bl-picks').first();
  if (picks.length) {
    const h1 = picks.find('.bl-picks__eyebrow').first();
    const h2 = picks.find('.bl-picks__title').first();
    rows.push([`${h1.length ? `<h1>${esc(txt(h1))}</h1>` : ''}${h2.length ? `<h2>${esc(txt(h2))}</h2>` : ''}`]);
    const grid = picks.find('.bl-picks__grid').length ? picks.find('.bl-picks__grid') : picks.find('.bl-picks__slider');
    grid.find('.bl-pick').each((_, p) => {
      const a = $(p).find('a').first();
      rows.push([img(p), `<h3>${link(a, esc(txt($(p).find('.bl-pick__title').first())))}</h3>`]);
    });
  }
  const sub = hero.find('.bl-subscribe').first();
  if (sub.length) {
    const input = sub.find('input').first();
    rows.push([[
      `<h4>${esc(txt(sub.find('h4').first()))}</h4>`,
      `<p>${esc(txt(sub.find('form > p, p').first()))}</p>`,
      `<p>${esc(input.attr('placeholder') || '')}</p>`,
      `<p>${esc(txt(sub.find('button').first()))}</p>`,
      sub.find('.bl-sr').length ? `<p>${esc(txt(sub.find('.bl-sr').first()))}</p>` : '',
    ].join('')]);
  }
  sections.push(block('bl-hero', rows));
}

// 3 category groups: one bl-group block per carousel group, all in one section
const card = (c) => {
  const a = $(c).find('.bl-card__link').first();
  const desc = $(c).find('.bl-card__desc').first();
  const tags = $(c).find('.bl-tag').toArray().map((t) => link(t)).join(' ');
  return [img(c), `<h3>${link(a, esc(txt($(c).find('.bl-card__title').first())))}</h3>${
    desc.length ? `<p>${esc(txt(desc))}</p>` : ''}${tags ? `<p>${tags}</p>` : ''}`];
};
const groups = $('.bl-group').toArray().map((g) => {
  const h2 = $(g).find('.bl-group__head h2').first();
  const more = $(g).find('.bl-more').first();
  const head = `<h2>${esc(txt(h2))}</h2>${more.length ? `<p>${link(more, esc(txt(more.find('.bl-more__text').first().length ? more.find('.bl-more__text').first() : more)))}</p>` : ''}`;
  return block('bl-group', [[head], ...$(g).find('.bl-card').toArray().map(card)]);
});
if (groups.length) sections.push(groups.join('\n'));

// 4 popular guides
const guides = $('.bl-guides').first();
if (guides.length) {
  const intro = guides.find('.bl-guides__intro').first();
  const lis = guides.find('.bl-guides__list a').toArray().map((a) => `<li>${link(a)}</li>`).join('');
  sections.push(block('bl-guides', [[`<h2>${esc(txt(intro.find('h2').first()))}</h2>${
    intro.find('p').toArray().map((p) => `<p>${esc(txt(p))}</p>`).join('')}`, `<ul>${lis}</ul>`]]));
}

// 5 body promo (shared hp-teaser block)
const teaser = $('.hp-teaser').first();
if (teaser.length) {
  const cta = teaser.find('.hp-teaser__cta a').first();
  sections.push(block('hp-teaser', [[img(teaser.find('.hp-teaser__img')),
    teaser.find('.hp-teaser__copy').children().toArray().map((n) => `<${n.tagName}>${esc(txt(n))}</${n.tagName}>`).join(''),
    cta.length ? `<p><strong>${link(cta)}</strong></p>` : '']]));
}

// 6 latest stories: title | cards | pagination
const latest = $('.bl-latest').first();
if (latest.length) {
  const rows = [[`<h2>${esc(txt(latest.find('.bl-latest__title').first()))}</h2>`]];
  latest.find('.bl-latest__grid .bl-card').each((_, c) => rows.push(card(c)));
  const pages = latest.find('.bl-pages li').toArray().map((li) => {
    const a = $(li).find('a').first();
    if (!a.length) return `<li>${esc(txt(li))}</li>`;
    if ($(li).attr('aria-current') === 'true' || a.attr('href') === '#') return `<li>${esc(txt(a))}</li>`;
    return `<li>${link(a, esc(txt(a.find('.bl-page-next__text').first().length ? a.find('.bl-page-next__text').first() : a)))}</li>`;
  });
  if (pages.length) rows.push([`<ul>${pages.join('')}</ul>`]);
  sections.push(block('bl-latest', rows));
}

const md = [['Title', meta.title || $('title').text()], ['Description', meta.description || $('meta[name=description]').attr('content') || ''],
  ['Canonical', meta.canonical || Z + pagePath], ['Template', 'listing'], ['nav', '/nav'], ['footer', '/footer']];
sections.push(block('metadata', md.map(([k, v]) => [k, esc(v)])));

const out = `<body>\n<header></header>\n<main>\n${sections.map((s) => `<div>\n${s}\n</div>`).join('\n')}\n</main>\n<footer></footer>\n</body>\n`;
fs.writeFileSync(args.out, out);
console.log(`encode: ${args.out} sections ${sections.length}, groups ${groups.length}, imgs ${(out.match(/<img /g) || []).length}`);
