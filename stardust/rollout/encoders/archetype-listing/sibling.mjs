// archetype-listing SIBLING encoder: a listing-template sibling (stardust/migrated/<path>/index.html,
// fidelityTier "sibling", rendered by stardust/rollout/encoders/sibling-listing/build.py) -> DA content.
// Called by encode.mjs when the page's _meta.json says fidelityTier: sibling (same CLI flags).
//
// Walks the migrated .bl-root children in source order (canon chrome skipped) and carries every
// string verbatim:
//   bl-subnav (marketplace family)   -> chrome: Metadata nav | /nav-marketplace, promo | off
//   section.bl-hero.bl-hero--<v>     -> bl-hero (<v>…): head row (crumbs ul, h1-h5, p), field row
//                                       (placeholder p), links row (ul), lead rows (media | copy),
//                                       media row (image + video link)
//   section.bl-listing > .bl-group   -> one bl-group (<v>…) per group: head row + one row per card
//   section.bl-guides                -> bl-guides (intro | list cell kept in order: sub-headings,
//                                       dates, links); merged into the previous listing section
//   section.bl-filters               -> bl-filters (bar): one row per filter (label | options)
//   section.bl-latest                -> [bl-filters (aside)] + bl-latest (<v>…): head row, cards,
//                                       tail (count, load more, logos, pagination)
//   section.hp-teaser                -> bl-promo (<v>…): one row per card (image | copy | CTAs)
// Section styles (live-measured band colours) come from sections.json beside this file.
// Card rows keep the source order of a card: media/logo images, eyebrow, title (heading or p,
// carrying the card link), desc/meta lines, rating (:bl-rating-N: icon), CTA.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from '/app/node_modules/cheerio/dist/esm/index.js';

export default function encodeSibling(args, meta, full) {
  const ROOT = '/workspace/3055ed88';
  const Z = 'https://www.zendesk.com';
  const MEDIA = `https://content.da.live/aemcoder/3055ed88/media/${args.scope}/`;
  const pagePath = args.page;
  const slug = full.slug;
  const src = fs.readFileSync(args.in, 'utf8');
  const mediaFiles = args['media-dir'] && fs.existsSync(args['media-dir']) ? fs.readdirSync(args['media-dir']) : [];
  const PLAN = new Set(JSON.parse(fs.readFileSync(`${ROOT}/stardust/.labs/site-plan.json`, 'utf8'))
    .pages.filter((p) => p.selected).map((p) => p.url));
  const D5 = ['/login/', '/register/'];
  const STYLES = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'sections.json'), 'utf8'));

  const $ = cheerio.load(src, { decodeEntities: false });
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attr = (s) => esc(s).replace(/"/g, '&quot;');
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const txt = (node) => norm($(node).clone().find('svg, input, script').remove().end().text());

  function href(h) {
    if (!h || h === '#') return '#';
    let u = new URL(h, Z + pagePath.replace(/\/?$/, '/index.html'));
    if (u.origin === Z) {
      u = new URL(u.href.replace(/index\.html(?=$|[?#])/, ''));
      const abs = u.href;
      // in-scope pages: root-relative, no trailing slash (EDS paths 404 with one)
      if (PLAN.has(abs.split(/[?#]/)[0]) && !D5.some((d) => u.pathname.endsWith(d))) return (u.pathname.replace(/(.)\/$/, '$1')) + u.search + u.hash;
      return abs;
    }
    return u.href;
  }
  function imgSrc(el) {
    const s = $(el).attr('src') || '';
    if (/^https?:/.test(s) && !mediaFiles.includes(path.basename(s.split('?')[0]))) return s;
    const base = path.basename(s.split('?')[0]);
    const stem = base.replace(/\.[a-z0-9]+$/i, '');
    const file = mediaFiles.find((f) => f === base) || mediaFiles.find((f) => f.replace(/\.[a-z0-9]+$/i, '') === stem) || base;
    return MEDIA + file;
  }
  // lazy-load placeholders the capture kept (80-byte inline SVG saved as .png) carry no image
  const placeholder = (el) => {
    const s = $(el).attr('src') || '';
    if (/^https?:/.test(s)) return false;
    const f = path.resolve(path.dirname(args.in), s.split('?')[0]);
    return fs.existsSync(f) && fs.statSync(f).size < 200 && fs.readFileSync(f, 'utf8').startsWith('<svg');
  };
  // an external image that could not be rehosted (hotlink-protected host: 403) would deliver as about:error
  const unhosted = (el) => /^https?:/.test(imgSrc(el)) && !imgSrc(el).startsWith('https://content.da.live/');
  const img = (el) => {
    if (placeholder(el)) return '';
    if (unhosted(el)) { console.error(`sibling: external image not rehosted, dropped: ${$(el).attr('src')}`); return ''; }
    return `<p><img src="${attr(imgSrc(el))}" alt="${attr($(el).attr('alt') || '')}"></p>`;
  };
  const link = (a, inner) => `<a href="${attr(href($(a).attr('href')))}">${inner ?? esc(txt(a))}</a>`;
  // inline content: text + links (+ em/strong/br), everything else unwrapped
  function inline(node) {
    let out = '';
    $(node).contents().each((_, c) => {
      if (c.type === 'text') out += esc(c.data.replace(/\s+/g, ' '));
      else if (c.type === 'tag') {
        if (['svg', 'input', 'script', 'img'].includes(c.tagName)) return;
        if (c.tagName === 'a') out += link(c, inline(c));
        else if (['em', 'strong'].includes(c.tagName)) out += `<${c.tagName}>${inline(c)}</${c.tagName}>`;
        else if (c.tagName === 'br') out += '<br>';
        else out += inline(c);
      }
    });
    return out.replace(/\s+/g, ' ').trim();
  }
  const block = (name, rows) => [`<div class="${name}">`,
    ...rows.map((r) => `<div>${r.map((c) => `<div>${c}</div>`).join('')}</div>`), '</div>'].join('\n');
  const variantsOf = (el, base) => ($(el).attr('class') || '').split(/\s+/)
    .filter((c) => c.startsWith(`${base}--`)).map((c) => c.slice(base.length + 2));
  const blockName = (base, vs) => (vs.length ? `${base} ${vs.join(' ')}` : base);
  const isHead = (el) => /^h[1-6]$/.test(el.tagName);

  // ---------- card: source order kept ----------
  function card(c) {
    const parts = [];
    const wrap = $(c).children('a.bl-card__link').first();
    const cardHref = wrap.length ? wrap : null;
    let titled = false;
    const walk = (n) => $(n).children().each((_, e) => {
      const $e = $(e);
      const cls = $e.attr('class') || '';
      if (e.tagName === 'a' && cls.includes('bl-card__link') && !cls.includes('bl-card__cta')) { walk(e); return; }
      if (cls.includes('bl-card__media') || cls.includes('bl-card__logo')) { $e.find('img').each((__, i) => parts.push(img(i))); return; }
      if (e.tagName === 'img') { parts.push(img(e)); return; }
      if (cls.includes('bl-rating')) {
        const n2 = parseInt(($e.attr('aria-label') || '').trim(), 10);
        if (n2 > 0) parts.push(`<p>:bl-rating-${n2}:</p>`);
        return;
      }
      if (cls.includes('bl-card__eyebrow')) { parts.push(`<p>${esc(txt(e))}</p>`); return; }
      if (cls.includes('bl-card__title')) {
        const t = inline(e);
        const inner = cardHref && !$e.find('a').length ? link(cardHref, t) : t;
        // a paragraph title (resource feature cards) is carried as h4 (below the h1-h3 outline)
        const tag = isHead(e) ? e.tagName : 'h4';
        parts.push(`<${tag}>${inner}</${tag}>`);
        titled = true;
        return;
      }
      if (cls.includes('bl-card__more')) { parts.push(`<p>${inline(e)}</p>`); return; }
      if (e.tagName === 'p' || isHead(e)) { const t = inline(e); if (t) parts.push(isHead(e) ? `<${e.tagName}>${t}</${e.tagName}>` : `<p>${t}</p>`); return; }
      walk(e);
    });
    walk(c);
    if (!titled && cardHref) parts.push(`<p>${link(cardHref)}</p>`);
    return [parts.join('')];
  }

  // ---------- sections ----------
  const sections = []; // { blocks: [], kind }
  let nav = null;
  const push = (kind, html) => sections.push({ kind, blocks: [html] });

  function hero(s) {
    const vs = variantsOf(s, 'bl-hero');
    const rows = [];
    const head = $(s).find('.bl-picks__head').first();
    if (head.length) {
      let cell = [];
      let links = [];
      let field = null;
      head.children().each((_, e) => {
        const $e = $(e);
        if (e.tagName === 'nav' && ($e.attr('class') || '').includes('bl-crumbs')) {
          cell.push(`<ul>${$e.find('li').toArray().map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
        } else if (($e.attr('class') || '').includes('bl-field')) {
          field = $e.find('input').attr('placeholder') || txt(e);
        } else if (e.tagName === 'hr') {
          // the divider is the links list's top rule (CSS)
        } else if (e.tagName === 'p' && $e.children('a.bl-cta--link-block').length) {
          links.push(`<li>${link($e.children('a').first())}</li>`);
        } else if (isHead(e)) cell.push(`<${e.tagName}>${inline(e)}</${e.tagName}>`);
        else if (e.tagName === 'p') cell.push(`<p>${inline(e)}</p>`);
      });
      if (cell.length) rows.push([cell.join('')]);
      if (field) rows.push([`<p>${esc(field)}</p>`]);
      if (links.length) rows.push([`<ul>${links.join('')}</ul>`]);
    }
    $(s).find('.bl-lead').each((_, l) => {
      const media = $(l).find('.bl-lead__media img').toArray().map(img).join('');
      const copy = $(l).find('.bl-lead__copy').children().toArray().map((e) => (isHead(e)
        ? `<${e.tagName}>${inline(e)}</${e.tagName}>`
        : `<p>${$(e).find('a.bl-cta--btn-primary').length ? `<strong>${inline(e)}</strong>` : inline(e)}</p>`)).join('');
      rows.push([media, copy]);
    });
    $(s).find('.bl-hero__media').each((_, m) => {
      // image + its video link in one cell (the link is the image's play control)
      let cell = $(m).find('img').toArray().map(img).join('');
      const v = $(m).find('[data-video]').attr('data-video') || '';
      const w = v.match(/^wistia:(\w+)/);
      if (w) cell += `<p><a href="https://fast.wistia.net/embed/iframe/${w[1]}">Play video</a></p>`;
      rows.push([cell]);
    });
    push('hero', block(blockName('bl-hero', vs), rows));
  }

  function groups(s) {
    const out = [];
    $(s).find('section.bl-group').each((_, g) => {
      const vs = variantsOf(g, 'bl-group');
      const head = $(g).children('.bl-group__head').first();
      const rows = [];
      if (head.length) {
        rows.push([head.children().toArray().map((e) => {
          if (isHead(e)) return `<${e.tagName}>${inline(e)}</${e.tagName}>`;
          return `<p>${inline(e)}</p>`;
        }).join('')]);
      } else vs.push('no-head');
      if ($(g).find('.bl-card__title').toArray().some((t) => t.tagName === 'p')) vs.push('features');
      // theme cards carry a full-width screenshot instead of a logo
      if ($(g).find('a.bl-card__link').toArray().some((a) => /\/marketplace\/themes\/\d/.test($(a).attr('href') || ''))) vs.push('themes');
      $(g).find('.bl-group__grid > .bl-card').each((__, c) => rows.push(card(c)));
      out.push(block(blockName('bl-group', vs), rows));
    });
    sections.push({ kind: 'listing', blocks: out });
  }

  function guides(s) {
    const vs = variantsOf(s, 'bl-guides');
    const intro = [];
    const list = [];
    const conv = (e) => {
      if (isHead(e)) return `<${e.tagName}>${inline(e)}</${e.tagName}>`;
      if (e.tagName === 'p') return `<p>${inline(e)}</p>`;
      if (e.tagName === 'ul' || e.tagName === 'ol') return `<ul>${$(e).find('li').toArray().map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`;
      return `<p>${inline(e)}</p>`;
    };
    const introEl = $(s).find('.bl-guides__intro').first();
    // sub-headings the render parked in the intro column belong to the list (grouped variant)
    introEl.children().each((i, e) => { (i === 0 ? intro : list).push(conv(e)); });
    $(s).find('.bl-guides__list').first().children().each((_, e) => list.push(conv(e)));
    if (list.some((x) => /^<h[1-6]/.test(x))) vs.push('grouped');
    if (list.some((x) => /^<p>[A-Z][a-z]+ \d{1,2}, \d{4}<\/p>$/.test(x))) vs.push('dated');
    const prev = sections[sections.length - 1];
    // a link box that follows a card listing sits inside that band (marketplace)
    const inListing = prev && prev.kind === 'listing';
    if (inListing) vs.push('box');
    const html = block(blockName('bl-guides', [...new Set(vs)]), [[intro.join(''), list.join('')]]);
    if (inListing) prev.blocks.push(html);
    else push('guides', html);
  }

  function filterRows(container, labelSel) {
    const rows = [];
    let cur = null;
    $(container).children().each((_, e) => {
      const $e = $(e);
      const cls = $e.attr('class') || '';
      if ((e.tagName === 'p' && !$e.find('input').length && !/\(\d+\)$/.test(txt(e))) || (labelSel && $e.is(labelSel))) {
        cur = [/^clear all$/i.test(txt(e)) ? `<p><a href="${attr(href(pagePath))}">${esc(txt(e))}</a></p>` : `<p>${esc(txt(e))}</p>`, []];
        rows.push(cur);
      } else if (cls.includes('bl-field') && $e.find('input[type=text], input:not([type])').length) {
        const label = norm($e.clone().find('input').remove().end().text());
        cur = [`<p>${esc(label)}</p>`, [`<li>${esc($e.find('input').attr('placeholder') || '')}</li>`]];
        rows.push(cur);
      } else if (e.tagName === 'ul') {
        if (!cur) { cur = ['', []]; rows.push(cur); }
        $e.find('li').each((__, li) => cur[1].push(`<li>${esc(txt(li))}</li>`));
      } else if (cur && txt(e)) cur[1].push(`<li>${esc(txt(e))}</li>`);
    });
    // label-only rows right after a label-only group label are that group's fields (Price range: From, To)
    const merged = [];
    rows.forEach((r) => {
      const prev = merged[merged.length - 1];
      if (prev && !r[1].length && prev.open) { prev[1].push(`<li>${r[0].replace(/^<p>|<\/p>$/g, '')}</li>`); return; }
      if (prev) prev.open = false;
      const row = [r[0], r[1]];
      row.open = !r[1].length && /^<p>/.test(r[0]) && !/clear all/i.test(r[0]);
      merged.push(row);
    });
    return merged.map(([l, items]) => (items.length ? [l, `<ul>${items.join('')}</ul>`] : [l]));
  }

  function filtersBar(s) {
    push('filters', block('bl-filters bar', filterRows($(s).children('.za-container').first())));
  }

  function latest(s) {
    const vs = variantsOf(s, 'bl-latest');
    const c = $(s).children('.za-container').first();
    const blocks = [];
    const head = [];
    const rows = [];
    const tail = [];
    let aside = null;
    let preHead = [];
    const hasAside = c.children('aside').length > 0;
    if (hasAside && !vs.includes('filters')) vs.push('filters');
    if (c.find('a.bl-card__link').toArray().some((a) => /\/marketplace\/themes\/\d/.test($(a).attr('href') || ''))) vs.push('themes');
    c.children().each((_, e) => {
      const $e = $(e);
      const cls = $e.attr('class') || '';
      if (e.tagName === 'aside') { aside = e; return; }
      if (cls.includes('bl-latest__grid')) { $e.children('.bl-card').each((__, cd) => rows.push(card(cd))); return; }
      const target = rows.length ? tail : head;
      if (cls.includes('bl-pages')) {
        target.push(`<ul>${$e.find('li').toArray().map((li) => {
          const a = $(li).find('a').first();
          if (!a.length || $(li).attr('aria-current') === 'true') return `<li>${esc(txt(li))}</li>`;
          return `<li>${link(a)}</li>`;
        }).join('')}</ul>`);
      } else if (cls.includes('bl-btn')) target.push(`<p>${esc(txt(e))}</p>`);
      else if (cls.includes('bl-img')) target.push(img($e.find('img')[0]));
      else if (cls.includes('bl-field')) { /* sort select box: its value is the p before it */ }
      else if (hasAside && isHead(e) && !cls.includes('bl-latest__title') && !head.length && !preHead.length) preHead.push(`<${e.tagName}>${inline(e)}</${e.tagName}>`);
      else if (isHead(e)) target.push(`<${e.tagName}>${inline(e)}</${e.tagName}>`);
      else target.push(`<p>${inline(e)}</p>`);
    });
    if (aside) {
      const frows = filterRows(aside, 'h5.bl-filters__label');
      blocks.push(block('bl-filters aside', [[preHead.join('')], ...frows]));
      preHead = [];
    }
    const lrows = [];
    if (preHead.length || head.length) lrows.push([[...preHead, ...head].join('')]);
    lrows.push(...rows);
    if (tail.length) lrows.push([tail.join('')]);
    if (!$(s).find('.bl-latest__title').length && !vs.includes('no-title')) vs.push('no-title');
    blocks.push(block(blockName('bl-latest', vs), lrows));
    sections.push({ kind: 'latest', blocks });
  }

  function promo(s) {
    const vs = variantsOf(s, 'hp-teaser');
    const cards = $(s).find('.hp-teaser__card').toArray();
    if (cards.length > 1 && !vs.includes('pair')) vs.push('pair');
    const rows = cards.map((cd) => {
      const imgs = $(cd).find('.hp-teaser__img img').toArray().map(img).join('');
      const copy = $(cd).find('.hp-teaser__copy').children().toArray()
        .map((e) => (isHead(e) ? `<${e.tagName}>${inline(e)}</${e.tagName}>` : `<p>${inline(e)}</p>`)).join('');
      const ctas = $(cd).find('.hp-teaser__cta a').toArray().map((a) => {
        const sec = ($(a).attr('class') || '').includes('secondary');
        return sec ? `<p><em>${link(a)}</em></p>` : `<p><strong>${link(a)}</strong></p>`;
      }).join('');
      if (!imgs && !vs.includes('text-only')) vs.push('text-only');
      return imgs ? [imgs, copy, ctas] : [copy, ctas];
    });
    const html = block(blockName('bl-promo', vs), rows);
    // a promo pair that follows the dated press list shares its band (newsroom)
    const prev = sections[sections.length - 1];
    if (vs.includes('pair') && prev && prev.kind === 'guides') prev.blocks.push(html);
    else push('promo', html);
  }

  $('.bl-root').children().each((_, e) => {
    const cls = $(e).attr('class') || '';
    if (/\bza-(promo|hdr|ftr)\b/.test(cls)) return;
    if (cls.includes('bl-subnav')) { if (!$(e).hasClass('bl-subnav--mobile')) nav = 'marketplace'; return; }
    if (cls.includes('bl-hero')) hero(e);
    else if (cls.includes('bl-listing')) groups(e);
    else if (cls.includes('bl-guides')) guides(e);
    else if (cls.includes('bl-filters')) filtersBar(e);
    else if (cls.includes('bl-latest')) latest(e);
    else if (cls.includes('hp-teaser')) promo(e);
    else if (txt(e)) console.error(`sibling: unhandled section ${cls}`);
  });

  // the closing text-only promo with a secondary CTA is the full-bleed band (industries)
  const last = sections[sections.length - 1];
  if (last && last.kind === 'promo' && /bl-promo[^"]*text-only/.test(last.blocks[0]) && last.blocks[0].includes('<em><a')) {
    last.blocks[0] = last.blocks[0].replace(/^<div class="([^"]+)">/, '<div class="$1 band">');
  }
  const styles = STYLES[slug] || {};
  // gen-B pages (theme legacy): every listing block carries the legacy variant (gen-B type scale)
  if ((styles.chrome || {}).theme === 'legacy') {
    sections.forEach((sec) => {
      sec.blocks = sec.blocks.map((b) => b.replace(/^<div class="([^"]+)">/, (m, c) => `<div class="${c.split(' ').includes('legacy') ? c : `${c} legacy`}">`));
    });
  }
  const secStyles = styles.sections || [];
  const out = sections.map((s, i) => {
    const st = secStyles[i];
    const sm = st ? `\n${block('section-metadata', [['<p>style</p>', `<p>${st}</p>`]])}` : '';
    return `<div>\n${s.blocks.join('\n')}${sm}\n</div>`;
  });

  const dec = (v) => cheerio.load(`<i>${v}</i>`, { decodeEntities: true })('i').text();
  const md = [['Title', dec(meta.title || $('title').text())], ['Description', dec(meta.description || '')],
    ['Canonical', meta.canonical || Z + pagePath], ['Template', 'listing']];
  const chrome = styles.chrome || (nav === 'marketplace' ? { nav: '/nav-marketplace', promo: 'off' } : {});
  md.push(['nav', chrome.nav || '/nav'], ['footer', chrome.footer || '/footer']);
  if (chrome.promo) md.push(['promo', chrome.promo]);
  if (chrome.theme) md.push(['theme', chrome.theme]);
  out.push(`<div>\n${block('metadata', md.map(([k, v]) => [`<p>${k}</p>`, `<p>${esc(v)}</p>`]))}\n</div>`);

  const doc = `<body>\n<header></header>\n<main>\n${out.join('\n')}\n</main>\n<footer></footer>\n</body>\n`;
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, doc);
  console.log(`encode (sibling): ${args.out} sections ${sections.length}, blocks ${sections.reduce((n, s) => n + s.blocks.length, 0)}, imgs ${(doc.match(/<img /g) || []).length}`);
}
