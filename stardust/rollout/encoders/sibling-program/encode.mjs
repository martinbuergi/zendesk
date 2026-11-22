// Program-sibling encoder: a rendered sibling (stardust/migrated/<path>/index.html) → DA document
// using the archetype's (service) block names and ROW SHAPES (content/service.html is the reference;
// ../archetype-program/gen-content.py is a one-off scraper of the service prototype and cannot read
// siblings). One section per data-module element; the module's variant classes ride on the block
// class (e.g. `sv-cards stats cols-3`). Section heads (eyebrow / heading / lede / head CTA before the
// first item) stay default content above the block, as on the archetype.
//
// Shapes (block JS reads them; see each block's header comment):
//   sv-hero      one row [text | media]; wistia → `<p><a href=fast.wistia.net/…>` after the block,
//                a text "Watch video" control → secondary CTA to the same wistia URL; mp4 → media-cell
//                link; trial form → note <p><strong>, CTA, hint, privacy; `logos` → extra rows
//                (row 2: strip heading, then one logo per row)
//   sv-promo     one row [picture | heading, body, CTA]
//   sv-cards     one row per card [picture | h3/h4, text, link]; stat → one cell <p><strong>fig</strong></p><p>label</p>
//   sv-accordion one row per item [title heading | body + the item's picture(s) (paired by order; a
//                companion overlay picture rides with its main one)]
//   sv-columns   (none) protect card: one row, lead cell <h2> + one cell per <h3> group;
//                media/text: row 1 [text | media], further rows = a grid of cells; tabs: one row per tab [label | panel]
//   sv-embed     (none) one cell, embed link; `video`: row 1 [text | media], row 2 optional aside box
//   sv-stories   one row per story [logo, stats | quote, name, role, link (| photo)]
//   sv-carousel  one row per card [picture | kind <p>, title link <p>, more <p>]
//   sv-links     one row per link [icon token | <p><a><strong>title</strong> description</a></p>]
//   sv-cta       one cell: eyebrow, <h2>, CTAs
//   sv-form      intro row, one row per field [label | type | name | options], closing row;
//                a named dialog (`modal`, live #modal.<name>) adds a `modal-<name>` class
//   sv-links subnav  one row [brand logo links | nav <ul> | CTA buttons]; the page gets nav | /nav-none
//   sv-columns event (section id countdown-*) row 1 [text + CTAs | picture], row 2 one cell per unit
// href-less live buttons (script-wired dialogs) get the page's matching #modal.<name> target.
// CTAs: hero/promo/cta/head/split CTAs are buttons (<strong><a> first, <em><a> after); legacy
// split-section links and card links stay plain text links (live: arrow links).
//
// Usage: node encode.mjs <rendered.html> <out.html> [--page-url https://www.zendesk.com/<path>/]
//        [--capture stardust/current/pages/<slug>.html] [--legacy] [--promo-off]
// Prints `sections N blocks N bytes N`; exit 1 when no block was produced.
import * as cheerio from '/app/node_modules/cheerio/dist/esm/index.js';
import fs from 'fs';

const argv = process.argv.slice(2);
const [inp, outp] = argv;
if (!inp || !outp) { console.error('usage: node encode.mjs <rendered.html> <out.html> [--page-url <url>] [--capture <html>] [--legacy] [--promo-off]'); process.exit(1); }
const opt = (k) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : null; };
const pageUrl = opt('--page-url');
const capPath = opt('--capture');
const LEGACY_PAGE = argv.includes('--legacy');
const PROMO_OFF = argv.includes('--promo-off');
const Z = 'https://www.zendesk.com';
const $ = cheerio.load(fs.readFileSync(inp, 'utf8'));
const slugOf = (pageUrl ? new URL(pageUrl).pathname : '').replace(/^\/|\/$/g, '').replace(/\//g, '-');
const TINTS = (() => { try { return JSON.parse(fs.readFileSync(new URL('./tints.json', import.meta.url), 'utf8'))[slugOf] || {}; } catch (e) { return {}; } })();
const capRaw = capPath && fs.existsSync(capPath) ? fs.readFileSync(capPath, 'utf8') : '';
const cap = capRaw ? cheerio.load(capRaw) : null;

// links: migrated-tree relative (../x/index.html) → site-root path; absolute zendesk → root path
const pagePath = pageUrl ? new URL(pageUrl).pathname : (inp.match(/migrated\/(.+)\/index\.html$/) ? `/${RegExp.$1}/` : '/');
$('a[href]').each((i, a) => {
  let h = $(a).attr('href');
  if (!/^([a-z]+:|\/|#)/i.test(h)) { const u = new URL(h, `${Z}${pagePath}`); h = u.pathname.replace(/index\.html$/, '') + u.search + u.hash; }
  // absolute source URLs: localize-links.mjs makes the in-scope ones root-relative
  $(a).attr('href', h.startsWith('/') ? `${Z}${h}` : h);
  $(a).removeAttr('data-broken-link');
});

// href-less CTA anchors (live AEM buttons wired to a dialog by script): point them at the page's
// named dialog sharing a word with the label (Download the report → #modal.download-report)
{
  const ids = [...new Set([...$('[data-modal]').map((i, x) => $(x).attr('data-modal')).get(), ...$('.sv-modal[id]').map((i, x) => $(x).attr('id')).get()])];
  const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  $('main a:not([href])').each((i, a) => {
    const t = words($(a).text());
    const id = ids.find((d) => words(d.replace(/-/g, ' ')).some((w) => t.includes(w)));
    if (id) $(a).attr('href', `#modal.${id}`);
  });
}

const cell = (h) => `<div>${h}</div>`;
const block = (name, rows) => `<div class="${name}">\n${rows.map((r) => `<div>${r.map(cell).join('')}</div>`).join('\n')}\n</div>`;
const sm = (style) => `<div class="section-metadata"><div><div><p>style</p></div><div><p>${style}</p></div></div></div>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const isTag = (n, re) => n && n.type === 'tag' && re.test(n.tagName);
const isHead = (n) => isTag(n, /^h[1-6]$/);
const isImg = (n) => isTag(n, /^img$/);

// DA-safe html of one node: images in <p>, presentational attributes dropped, divs unwrapped
function clean(el) {
  const c = $('<div>').append($(el).clone());
  c.find('[class]').removeAttr('class');
  c.find('*').each((i, x) => { for (const a of ['id', 'target', 'rel', 'width', 'height', 'loading', 'role', 'type', 'style']) $(x).removeAttr(a); });
  c.find('img').each((i, x) => { if (!$(x).parent().is('p')) $(x).wrap('<p></p>'); });
  c.find('cite').each((i, x) => { $(x).replaceWith($(x).contents()); });
  c.find('div').each((i, x) => { $(x).replaceWith($(x).contents()); });
  return c.html().replace(/<p>\s*<\/p>/g, '');
}
const html = (nodes) => nodes.map((n) => clean(n)).join('');
const altOf = (n) => { const a = $(n).attr('alt') || ''; return a === '[object Object]' ? '' : a; };
const imgP = (n) => `<p><img src="${$(n).attr('src')}" alt="${esc(altOf(n))}"></p>`;
// a CTA paragraph as a button: first primary (<strong>), others secondary (<em>)
function cta(n, k) {
  const a = $(n).find('a').first();
  const w = k === 0 ? 'strong' : 'em';
  return `<p><${w}><a href="${a.attr('href')}">${a.html()}</a></${w}></p>`;
}
const isCtaP = (n) => isTag(n, /^p$/) && $(n).find('a').length === 1 && $(n).text().trim() === $(n).find('a').text().trim();
// text nodes with CTAs as buttons
// the live AEM button model (hydrated capture JSON, page order): per CTA label, its objects in order —
// `type` "link" = an arrow text link on live (stays a plain link), a `button1` followed by a text-less
// `button2` = an empty second slot the live link group still lays out (variant `ghost-cta`)
const CAP_BTNS = (() => {
  const m = new Map();
  if (!capRaw) return m;
  for (const x of capRaw.matchAll(/"(button\d*)":\{([^{}]*)"text":"((?:[^"\\]|\\.)*)","buttonLink":/g)) {
    let label; try { label = JSON.parse(`"${x[3]}"`).trim(); } catch (e) { label = x[3]; }
    const type = (/"type":"(\w+)"/.exec(x[2]) || [])[1];
    const after = capRaw.slice(x.index, x.index + 2000);
    const b2 = after.indexOf('"button2":{');
    const ghost = x[1] === 'button1' && b2 > 0 && !/"text":/.test(after.slice(b2, after.indexOf(':type', b2)));
    if (!m.has(label)) m.set(label, []);
    m.get(label).push({ type, ghost });
  }
  return m;
})();
const CAP_SEEN = new Map();
let GHOST = false;
// consult the next capture object for this CTA label (gen A pages only); true = keep it a plain link
function capLink(n) {
  if (LEGACY_PAGE || !CAP_BTNS.size) return false;
  const t = $(n).text().trim();
  const list = CAP_BTNS.get(t);
  if (!list) return false;
  const k = CAP_SEEN.get(t) || 0;
  CAP_SEEN.set(t, k + 1);
  const o = list[Math.min(k, list.length - 1)];
  if (o.ghost) GHOST = true;
  return o.type === 'link';
}
function textWithCtas(nodes, buttons = true, k0 = 0) {
  let k = k0;
  return nodes.map((n) => (buttons && isCtaP(n) && !capLink(n) ? cta(n, k++) : clean(n))).join('');
}
const wistia = (n) => { const v = $(n).attr('data-video') || ''; return v.startsWith('wistia:') ? `https://fast.wistia.net/embed/iframe/${v.slice(7)}` : null; };
const videoP = (n) => `<p><a href="${$(n).attr('src')}">${esc($(n).attr('aria-label') || 'Video')}</a></p>`;

// the box's top-level nodes (text nodes dropped)
const kidsOf = (sec) => { const box = sec.children('.za-container').first(); return (box.length ? box : sec).contents().toArray().filter((n) => n.type === 'tag' && !(n.tagName === 'button' && !$(n).text().trim())); };
const itemRe = /^(sv-card|sv-stat|sv-story|sv-acc__item|sv-res__slide|sv-hero__logo|sv-tabs__panel)$/;
const isItem = (n) => n.type === 'tag' && itemRe.test($(n).attr('class') || '');

// split at the first item: head (before), items, tail (after the last item)
function splitItems(kids) {
  const first = kids.findIndex(isItem);
  if (first < 0) return { head: kids, items: [], tail: [] };
  let last = kids.length - 1;
  while (last >= 0 && !isItem(kids[last])) last -= 1;
  return { head: kids.slice(0, first), items: kids.slice(first, last + 1).filter(isItem), between: kids.slice(first, last + 1).filter((n) => !isItem(n)), tail: kids.slice(last + 1) };
}

// split a run of nodes into text and media
function textMedia(nodes) {
  const text = []; const media = []; const after = [];
  nodes.forEach((n) => {
    if (isImg(n)) media.push(imgP(n));
    else if (isTag(n, /^video$/)) media.push(videoP(n));
    else if (isTag(n, /^iframe$/)) media.push(`<p><a href="${$(n).attr('src')}">${esc($(n).attr('title') || $(n).attr('src'))}</a></p>`);
    else if (isTag(n, /^div$/) && wistia(n)) {
      $(n).find('img').each((i, m) => media.push(imgP(m)));
      const label = $(n).find('button').text().trim();
      const url = wistia(n);
      if (label) text.push({ wistiaCta: url, label });
      else after.push(url);
    } else text.push(n);
  });
  return { text, media, after };
}

function heroRow(nodes, buttons = true) {
  // a picture before the first heading is the eyebrow (live CX Trends lockup above the h1)
  const hi = nodes.findIndex(isHead);
  const lead = hi > 0 ? nodes.slice(0, hi).filter(isImg) : [];
  const { text, media, after } = textMedia(nodes.filter((n) => !lead.includes(n)));
  let k = 0; const parts = lead.map(imgP);
  text.forEach((n) => {
    if (n.wistiaCta) { parts.push(`<p><em><a href="${n.wistiaCta}">${esc(n.label)}</a></em></p>`); after.push(n.wistiaCta); k += 1; return; }
    if (isTag(n, /^form$/)) {
      // trial form: note, CTA (submit), hint, privacy — the archetype's trial shape
      const f = $(n);
      const ps = f.children('p').toArray();
      const note = ps.find((p) => $(p).children('strong').length);
      const priv = ps.find((p) => $(p).find('a').length);
      const hint = ps.find((p) => p !== note && p !== priv);
      if (note) parts.push(clean(note));
      parts.push(`<p><strong><a href="https://www.zendesk.com/register/">${esc(f.find('button').text().trim() || 'Start your free trial')}</a></strong></p>`);
      if (hint) parts.push(clean(hint));
      if (priv) parts.push(clean(priv));
      k += 1;
      return;
    }
    if (buttons && isCtaP(n) && !capLink(n)) parts.push(cta(n, k++));
    else parts.push(clean(n));
  });
  return { row: [parts.join(''), media.join('')], after: [...new Set(after)] };
}

// headings whose live markup carries an inline element (e.g. `start at <span>$19</span>/month`):
// keep the element boundary as <em> (DA drops spans; the block CSS sets it upright)
if (cap) {
  $('main h1, main h2, main h3, main h4, main h5').each((i, h) => {
    if ($(h).children().length) return;
    const t = $(h).text().replace(/\s+/g, ' ').trim();
    const ch = cap('main h1, main h2, main h3, main h4, main h5').filter((j, x) => cap(x).text().replace(/\s+/g, ' ').trim() === t && cap(x).children('span').length && cap(x).children().length === cap(x).children('span').length).first();
    if (ch.length) $(h).html(ch.contents().toArray().map((n) => (n.type === 'text' ? esc(cap(n).text()) : `<em>${esc(cap(n).text())}</em>`)).join(''));
  });
}

const S = [];
let blocks = 0;
$('main [data-module]').each((i, el) => {
  const sec = $(el); const mod = sec.attr('data-module');
  const v = new Set((sec.attr('data-variant') || '').split(/\s+/).filter(Boolean));
  if (LEGACY_PAGE) v.add('legacy');
  if (TINTS[i]) TINTS[i].split(/\s+/).forEach((x) => (x.startsWith('!') ? v.delete(x.slice(1)) : v.add(x)));
  const legacy = v.has('legacy');
  // named dialogs (live `#modal.<name>` targets): the name rides as a `modal-<name>` variant class
  const MODAL_ID = v.has('modal') ? (sec.attr('data-modal') || (sec.attr('id') !== 'contact-sales' ? sec.attr('id') : '')) || '' : '';
  const kids = kidsOf(sec);
  let out = '';
  const name = () => [mod, ...v].join(' ');

  if (mod === 'sv-form') {
    const f = sec.find('form').first();
    const pp = f.find('p').last();
    const intro = f.clone();
    intro.find('input,select,textarea,button').remove();
    f.find('label[for]').each((j, l) => intro.find(`label[for="${$(l).attr('for')}"]`).remove());
    intro.find('p').last().remove();
    // field hints (a <p> right after a field) ride their field's label cell
    const hints = new Map();
    f.find('input,select,textarea').each((j, x) => { const nx = $(x).next(); if (nx.is('p') && !nx.is(pp)) { hints.set(x, nx); intro.find('p').filter((k, p) => $(p).text() === nx.text()).remove(); } });
    const rows = [[clean(intro).replace(/^<form[^>]*>|<\/form>$/g, '')]];
    f.find('input,select,textarea').each((j, x) => {
      const lab = f.find(`label[for="${$(x).attr('id')}"]`).text().trim() || $(x).attr('aria-label') || '';
      const typ = x.tagName === 'input' ? ($(x).attr('type') || 'text') : x.tagName;
      const h = hints.get(x);
      const r = [`<p>${esc(lab)}</p>${h ? `<p>${h.html()}</p>` : ''}`, typ, $(x).attr('name') || ''];
      if (typ === 'select') r.push(`<ul>${$(x).find('option').filter((k, o) => $(o).attr('value')).map((k, o) => `<li>${$(o).text()}</li>`).get().join('')}</ul>`);
      rows.push(r);
    });
    rows.push([clean(pp) + `<p>${esc(f.find('button').last().text().trim() || 'Submit')}</p>`]);
    out = block(name(), rows);
  } else if (mod === 'sv-hero') {
    const { head, items } = splitItems(kids);
    let main = head; let stripHead = [];
    if (items.length) { // logos strip: its heading is the last heading before the logos
      const hi = head.length - 1;
      if (isHead(head[hi])) { stripHead = [head[hi]]; main = head.slice(0, hi); }
    }
    // a video before the heading is the band's full-bleed background (live /cxtrends/)
    const hi = main.findIndex(isHead);
    if (hi > 0 && main.slice(0, hi).some((n) => isTag(n, /^video$/))) v.add('bg-video');
    const { row, after } = heroRow(main);
    const rows = [row];
    if (items.length) {
      rows.push([html(stripHead)]);
      items.forEach((it) => rows.push([html($(it).children().toArray())]));
    }
    out = block(name(), rows) + after.map((u) => `\n<p><a href="${u}">Play video</a></p>`).join('');
  } else if (mod === 'sv-promo') {
    const { text, media } = textMedia(kids);
    out = block(name(), [[media.join(''), textWithCtas(text)]]);
  } else if (mod === 'sv-cards') {
    const { head, items, tail } = splitItems(kids);
    if (head.some(isImg)) v.add('split');
    const rows = items.map((it) => {
      const c = $(it).children().toArray();
      if ($(it).hasClass('sv-stat')) return [`<p><strong>${$(c[0]).html()}</strong></p>${html(c.slice(1))}`];
      if (c.length === 1 && isTag(c[0], /^a$/) && $(c[0]).find('img').length && $(c[0]).find('h1,h2,h3,h4,h5,h6').length) {
        // legacy post grid (live /repeatcustomer/): the whole card is one link → picture | linked title
        v.add('posts');
        const a = $(c[0]); const h = a.find('h1,h2,h3,h4,h5,h6').first(); const tag = h[0].tagName;
        return [imgP(a.find('img')[0]), `<${tag}><a href="${a.attr('href')}">${h.html()}</a></${tag}>`];
      }
      const media = c.filter(isImg); const rest = c.filter((n) => !isImg(n));
      return media.length ? [media.map(imgP).join(''), html(rest)] : [html(rest)];
    });
    if (tail.length) rows.push([textWithCtas(tail)]);
    out = `${textWithCtas(head)}\n${block(name(), rows)}`;
  } else if (mod === 'sv-accordion') {
    const { head, items, between, tail } = splitItems(kids);
    // pictures pair with items by order; a companion picture (file stem extends the previous one's,
    // e.g. tab-2-b after tab-2, tab-4-logos after tab-4: the live overlay card) joins that item
    const stem = (n) => ($(n).attr('src') || '').split('?')[0].split('/').pop().replace(/\.[a-z0-9]+$/i, '').replace(/-2x$/, '');
    const groups = [];
    [...head.filter(isImg), ...(between || []).filter(isImg)].forEach((n) => {
      const prev = groups[groups.length - 1];
      if (prev && stem(n).startsWith(`${stem(prev[0])}-`)) prev.push(n); else groups.push([n]);
    });
    const headText = head.filter((n) => !isImg(n));
    const rows = items.map((it, j) => {
      const c = $(it).children().toArray();
      const t = c.find(isHead) || c[0];
      return [clean(t), html(c.filter((n) => n !== t)) + (groups[j] || []).map(imgP).join('')];
    });
    // trailing composition (legacy: image + heading + text card) → aside row
    if (tail.length) { v.add('aside'); rows.push([html(tail)]); }
    out = `${textWithCtas(headText)}\n${block(name(), rows)}`;
  } else if (mod === 'sv-columns') {
    if (v.has('tabs')) {
      const labels = sec.find('.sv-tabs__list').children().toArray().map((b) => $(b).text().trim());
      const panels = sec.find('.sv-tabs__panel').toArray();
      out = block(name(), panels.map((p, j) => [`<p>${esc(labels[j] || `Tab ${j + 1}`)}</p>`, html($(p).children().toArray().map((n) => (isTag(n, /^iframe$/) ? $(`<p><a href="${$(n).attr('src')}">${esc($(n).attr('src'))}</a></p>`)[0] : n)))]));
    } else if (v.has('media')) {
      // row 1 [text | media]; repeated image+heading groups after the lead media → grid row
      const imgIdx = kids.findIndex(isImg);
      const lead = imgIdx < 0 ? kids : kids.slice(0, imgIdx);
      const rest = imgIdx < 0 ? [] : kids.slice(imgIdx);
      const groups = []; rest.forEach((n) => { if (isImg(n)) groups.push([n]); else if (groups.length) groups[groups.length - 1].push(n); });
      if (rest.length >= 3 && rest.every(isImg) && lead.every(isHead)) {
        // award badges (live /why-zendesk/ "Our awards"): centered head, one cell per badge
        v.add('badges');
        out = block(name(), [[html(lead)], rest.map(imgP)]);
      } else if (groups.length > 1 && groups.every((g) => g.length > 1)) {
        v.add('grid');
        out = block(name(), [[textWithCtas(lead, !legacy)], groups.map((g) => html(g))]);
      } else {
        // legacy: a lone CTA under the heading (no body copy) is the live outline button (secondary);
        // CTAs after body copy stay arrow links
        const loneCta = legacy && !lead.some((n) => isTag(n, /^p$/) && !isCtaP(n));
        const text = loneCta ? textWithCtas(lead, true, 1) : textWithCtas(lead, !legacy);
        out = block(name(), [[text, rest.filter(isImg).map(imgP).join('')]]);
      }
    } else if (v.has('text') && /^countdown-/.test(sec.attr('id') || '')) {
      // event countdown card (live AEM countdown): row 1 [text + CTAs | speaker picture (a CSS
      // background on live, carried as tints.json "<i>.media")], row 2 one cell per countdown unit
      // (capture-time static text, see _meta.json dynamic-content)
      v.add('event');
      const cd = kids.filter((n) => isTag(n, /^p$/) && /^(\d+[dhm]){2,}$/.test($(n).text().trim()));
      const rest = kids.filter((n) => !cd.includes(n));
      const pic = TINTS[`${i}.media`];
      const units = cd.flatMap((n) => $(n).text().trim().match(/\d+[dhm]/g)).map((u) => `<p>${u}</p>`);
      const rows = [[textWithCtas(rest), pic ? `<p><img src="${pic}" alt=""></p>` : '']];
      if (units.length) rows.push(units);
      out = block(name(), rows);
    } else if (v.has('text') && kids.some((n) => isTag(n, /^p$/) && $(n).text().trim() === '0123456789')) {
      // animated counters (live #datapoints): the render flattened each figure into its value, the
      // digit reels ("0123456789") and suffix pieces, then the label → sv-cards stats, one row per figure
      const ps = kids.filter((n) => isTag(n, /^p$/));
      const reel = (n) => n && $(n).text().trim() === '0123456789';
      const figs = ps.map((n, j) => (!reel(n) && reel(ps[j + 1]) && !reel(ps[j - 1]) ? j : -1)).filter((j) => j >= 0);
      const head = kids.filter((n) => !ps.includes(n) || ps.indexOf(n) < figs[0]);
      const rows = figs.map((f, j) => {
        const end = j + 1 < figs.length ? figs[j + 1] : ps.length;
        return [`<p><strong>${esc($(ps[f]).text().trim())}</strong></p><p>${esc($(ps[end - 1]).text().trim())}</p>`];
      });
      out = `${textWithCtas(head)}\n${block(['sv-cards', 'stats', 'counter', ...[...v].filter((x) => x !== 'text')].join(' '), rows)}`;
    } else if (v.has('text') && v.has('banner')) {
      // forest CTA banner (live /why-zendesk/): one cell, heading + body + button
      out = block(name(), [[textWithCtas(kids)]]);
    } else if (v.has('text')) {
      const h3 = kids.findIndex((n) => isTag(n, /^h[3-6]$/));
      const a = h3 < 0 ? kids : kids.slice(0, h3); const b = h3 < 0 ? [] : kids.slice(h3);
      out = block(name(), [b.length ? [html(a), html(b)] : [html(a)]]);
    } else {
      const cells = []; let cur = [];
      kids.forEach((n) => { if (isTag(n, /^h[3-4]$/) && cur.length) { cells.push(cur); cur = []; } cur.push(n); });
      if (cur.length) cells.push(cur);
      out = block(name(), [cells.map((c) => html(c))]);
    }
  } else if (mod === 'sv-embed') {
    if (v.has('video')) {
      // row 1 [text | media]; a trailing heading group after the media → aside row
      const mi = kids.findIndex((n) => isImg(n) || isTag(n, /^(video|iframe)$/) || (isTag(n, /^div$/) && wistia(n)));
      const lead = mi < 0 ? kids : kids.slice(0, mi + 1);
      const tail = mi < 0 ? [] : kids.slice(mi + 1);
      const { row, after } = heroRow(lead, !legacy);
      // the wistia URL rides as default content right after the block (D1, as on sv-hero)
      const rows = [[row[0], row[1]]];
      if (tail.length) rows.push([textWithCtas(tail)]);
      out = block(name(), rows) + after.map((u) => `\n<p><a href="${u}">Play video</a></p>`).join('');
    } else {
      const fi = kids.findIndex((n) => isTag(n, /^(iframe|video)$/) || (isTag(n, /^div$/) && wistia(n)));
      const head = fi < 0 ? kids : kids.slice(0, fi);
      const fr = kids[fi];
      const src = fr ? ($(fr).attr('src') || wistia(fr)) : '';
      // guided-tour embeds (Storylane / Reprise) are not rendered below 768px on live (as on /service/)
      if (/storylane\.io|getreprise\.com/.test(src)) v.add('desktop');
      out = `${textWithCtas(head)}\n${block(name(), [[`<p><a href="${src}">${esc($(fr).attr('title') || $(head.find(isHead)).text() || 'Embed')}</a></p>`]])}`;
    }
  } else if (mod === 'sv-stories') {
    const { head, items, tail } = splitItems(kids);
    let rows;
    const plain = items.every((it) => $(it).children().length === 1);
    if (plain && items.length % 2 === 0) {
      // logos + quotes listed separately (legacy logo carousel): pair them by order
      const n = items.length / 2;
      rows = items.slice(0, n).map((it, j) => [html($(it).children().toArray()), html($(items[n + j]).children().toArray())]);
    } else {
      rows = items.map((it) => {
        const c = $(it).children().toArray();
        const logo = c.find(isImg);
        const stats = c.filter((n) => $(n).hasClass('sv-stat')).map((s) => { const p = $(s).children().toArray(); return `<p><strong>${$(p[0]).html()}</strong></p>${html(p.slice(1))}`; }).join('');
        const quote = c.find((n) => isTag(n, /^blockquote$/));
        const title = c.filter((n) => isTag(n, /^p$/) && !$(n).find('a').length && c.indexOf(n) < c.indexOf(quote));
        const citeEl = c.find((n) => isTag(n, /^cite$/));
        const who = citeEl ? $(citeEl).children('p').toArray() : [];
        const links = [...(citeEl ? $(citeEl).children('a').toArray().map((a) => $(`<p></p>`).append($(a).clone())[0]) : []), ...c.filter((n) => isCtaP(n))];
        const r = [(logo ? imgP(logo) : '') + stats, html(title) + (quote ? `<blockquote><p>${$(quote).text().trim()}</p></blockquote>` : '') + html(who) + html(links)];
        return r;
      });
      // a photo beside the single story
      const photo = tail.filter(isImg);
      if (photo.length && rows.length === 1) rows[0].push(photo.map(imgP).join(''));
    }
    const rest = rows[0] && rows[0].length === 3 ? tail.filter((n) => !isImg(n)) : tail;
    if (rest.length) rows.push([html(rest)]);
    out = `${textWithCtas(head)}\n${block(name(), rows)}`;
  } else if (mod === 'sv-carousel') {
    const { head, items } = splitItems(kids);
    const rows = items.map((it) => {
      const a = $(it).find('a').first();
      const c = a.children().toArray();
      const img = c.find(isImg);
      const ps = c.filter((n) => isTag(n, /^p$/));
      const h = c.find(isHead);
      // new template: kind <p>, title <p>; legacy: title heading, kind <p>, more <p>
      const kind = h ? ps[0] : ps[0];
      const title = h ? $(h).text().trim() : $(ps[1]).text().trim();
      const more = h ? ps.slice(1) : ps.slice(2);
      if (h) return [img ? imgP(img) : '', `<p><a href="${a.attr('href')}">${esc(title)}</a></p>${[kind, ...more].filter(Boolean).map((p) => `<p>${$(p).html()}</p>`).join('')}`];
      return [img ? imgP(img) : '', `${kind ? `<p>${$(kind).html()}</p>` : ''}<p><a href="${a.attr('href')}">${esc(title)}</a></p>${more.map((p) => `<p>${$(p).html()}</p>`).join('')}`];
    });
    out = `${textWithCtas(head)}\n${block(name(), rows)}`;
  } else if (mod === 'sv-links' && v.has('subnav')) {
    // landing / microsite header bar: one row [brand logos | nav list | CTAs]
    const box = sec.children('.za-container').first();
    const brand = []; const nav = []; const ctas = [];
    box.find('a').each((j, a) => {
      const A = $(a); const href = A.attr('href');
      const img = A.find('img').first();
      if (img.length) brand.push(`<p><a href="${href}"><img src="${img.attr('src')}" alt="${esc(img.attr('alt') || '')}"></a></p>`);
      else if (!A.text().trim()) brand.push(`<p><a href="${href}" title="${esc(A.attr('aria-label') || 'Zendesk home')}">:za-logo:</a></p>`);
      else if (A.closest('li').length) nav.push(`<li><a href="${href}">${esc(A.text().trim())}</a></li>`);
      else { const w = ctas.length ? 'em' : 'strong'; ctas.push(`<p><${w}><a href="${href}">${esc(A.text().trim())}</a></${w}></p>`); }
    });
    out = block(name(), [[brand.join(''), nav.length ? `<ul>${nav.join('')}</ul>` : '', ctas.join('')]]);
  } else if (mod === 'sv-links') {
    const ci = kids.findIndex((n) => $(n).hasClass('sv-caps') || $(n).find('.sv-caps').length);
    const head = ci < 0 ? kids.filter((n) => !$(n).find('a').length) : kids.slice(0, ci);
    const icons = { '/service/ai/ai-agents/': 'sv-ai-agents', '/employee-service/ai-agents/': 'sv-ai-agents', '/service/ai/': 'sv-ai-automation', '/platform/': 'sv-platform', '/service/knowledge/': 'sv-knowledge', '/service/quality-assurance/': 'sv-qa', '/service/analytics/': 'sv-analytics', '/service/ticketing-system/': 'sv-ticketing', '/service/voice/': 'sv-voice', '/service/workforce-engagement-management/': 'sv-wfm', '/customer-data-privacy-protection/': 'sv-privacy', '/service/messaging/': 'sv-messaging', '/marketplace/': 'sv-integrations' };
    const rows = sec.find('.sv-caps a').toArray().map((a) => {
      const href = $(a).attr('href');
      const txt = $(a).text().trim();
      // title / description split from the hydrated capture (the render concatenated them)
      let title = txt; let sub = '';
      if (cap) {
        const want = txt.replace(/\s+/g, '');
        const ca = cap('a').filter((j, x) => cap(x).text().replace(/\s+/g, '') === want && cap(x).find('span span').length >= 2).first();
        if (ca.length) { const sp = ca.find('span span'); title = cap(sp[0]).text().trim(); sub = cap(sp[1]).text().trim(); }
      }
      const key = href.replace(/^https:\/\/www\.zendesk\.com/, '');
      return [icons[key] ? `<p>:${icons[key]}:</p>` : '', `<p><a href="${href}"><strong>${esc(title)}</strong>${sub ? ` ${esc(sub)}` : ''}</a></p>`];
    });
    out = `${textWithCtas(head)}\n${block(name(), rows)}`;
  } else if (mod === 'sv-cta') {
    // the live AEM model marks display-size headings with "variant":"h1"; a plain h2 → `small`
    const h = kids.find(isHead);
    if (h && capRaw && !legacy) {
      const t = $(h).text().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = new RegExp(`"text":"${t}"[^}]*}`).exec(capRaw) || new RegExp(`\\{[^{}]*"text":"${t}"[^}]*}`).exec(capRaw);
      if (m && !/"variant":"h1"/.test(m[0])) v.add('small');
    }
    out = block(name(), [[textWithCtas(kids)]]);
  } else {
    out = block(name(), [[html(kids)]]);
  }
  if (GHOST) { out = out.replace(/^(<div class="sv-[^"]*)"/m, '$1 ghost-cta"'); GHOST = false; }
  if (MODAL_ID) out = out.replace(/^(<div class="[^"]*)"/m, `$1 modal-${MODAL_ID}"`);
  if (mod === 'sv-stories' && !legacy && !/tint-/.test(TINTS[i] || '')) out += `\n${sm('cream')}`;
  blocks += (out.match(/<div class="sv-/g) || []).length;
  S.push(out);
});
// legacy blog-family pages (live /repeatcustomer/): the capture's second global header is the blog
// sub-bar (brand link + top-level section links) → a `sv-links subnav blog` bar above the hero
if (cap && LEGACY_PAGE) {
  const bh = cap('header[data-nmw-id="v1-global-header-blog"]').first();
  if (bh.length) {
    const abs = (h) => (h.startsWith('/') ? `${Z}${h}` : h);
    const br = bh.find('a[href="/blog/"]').first();
    const nav = bh.find('a[tabindex="0"][data-location="navigation"]').toArray()
      .map((x) => `<li><a href="${abs(cap(x).attr('href'))}">${esc(cap(x).text().trim())}</a></li>`);
    if (br.length) {
      S.unshift(block('sv-links subnav blog', [[`<p><a href="${abs('/blog/')}">${esc(br.text().trim())}</a></p>`, nav.length ? `<ul>${nav.join('')}</ul>` : '', '']]));
      blocks += 1;
    }
  }
}
const title = $('title').text();
const desc = $('meta[name="description"]').attr('content') || '';
const canon = $('link[rel="canonical"]').attr('href') || '';
const metaRows = [['Title', esc(title)], ['Description', esc(desc)], ['Canonical', canon]];
if (LEGACY_PAGE) metaRows.push(['nav', '/nav-legacy'], ['footer', '/footer-legacy'], ['theme', 'legacy']);
else if (PROMO_OFF) metaRows.push(['promo', 'off']);
// live landing / microsite pages whose own sv-links subnav replaces the global header: no nav doc
// (header.js returns on a missing fragment; the loaded header box collapses to display: contents)
if ($('main [data-module="sv-links"][data-variant~="subnav"]').length) metaRows.push(['nav', '/nav-none']);
const meta = block('metadata', metaRows);
const body = `<body>\n<header></header>\n<main>\n${S.map((s) => `<div>\n${s}\n</div>\n`).join('')}<div>\n${meta}\n</div>\n</main>\n<footer></footer>\n</body>\n`;
fs.writeFileSync(outp, body);
console.log(`sections ${S.length} blocks ${blocks} bytes ${body.length}`);
process.exit(blocks ? 0 : 1);
