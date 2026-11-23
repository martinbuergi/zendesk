/* eslint-disable */
/* global WebImporter */

/**
 * sv-hero parser (template service-2).
 * Source: #main-content > div > section.sc-f23d7fd5-11:has(h1)
 *
 * Output (matches blocks/sv-hero/sv-hero.js and content/platform|service|why-zendesk):
 *   row 1: [ text cell | media cell ]
 *     text: eyebrow <p>, <h1>, lede <p>s, CTAs (<p><strong><a> primary, <p><em><a> secondary;
 *           a Wistia CTA links to https://fast.wistia.net/embed/iframe/{id})
 *     trial form: <p><strong>note</strong> ...</p>, <p><strong><a>submit</a></strong></p>,
 *           hint <p>, privacy <p> with link
 *     media: <img>
 *   logos (LogoTypeRow): row 2 = strip <h2>, rows 3+ = one logo <img> each
 *   A Wistia poster in the media column becomes a default-content
 *   <p><a href="wistia">Play video</a></p> right after the block.
 * Options: video (any Wistia link), trial (email form), logos (logo row).
 */
const WISTIA_RE = /wistia_async_([a-z0-9]{6,})/i;

function wistiaId(root) {
  const el = root.querySelector('[class*="wistia_async_"]');
  if (!el) return '';
  const m = WISTIA_RE.exec(el.className);
  return m ? m[1] : '';
}

// the content image (not the next/image sizer); lazy images may carry a data: placeholder src
function realImg(root, document) {
  const imgs = [...root.querySelectorAll('img')];
  const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute('src') || '') && !i.id;
  const pick = imgs.find((i) => /^image-/.test(i.id || '')) || imgs.find((i) => !isSizer(i));
  if (!pick) return null;
  let src = pick.getAttribute('src') || '';
  if (!src || src.startsWith('data:')) {
    const set = pick.getAttribute('srcset') || pick.getAttribute('data-srcset') || '';
    const fromSet = (set.split(',').pop() || '').trim().split(/\s+/)[0];
    src = pick.getAttribute('data-src') || fromSet || src;
  }
  if (src.startsWith('data:')) {
    // next/image keeps the real <img> in a sibling <noscript> until it lazy-loads
    const ns = pick.parentElement && pick.parentElement.querySelector('noscript');
    const m = ns && /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || '');
    if (m && !m[1].startsWith('data:')) src = m[1].replace(/&amp;/g, '&');
  }
  if (!src) return null;
  const out = document.createElement('img');
  out.src = src;
  out.alt = pick.getAttribute('alt') || '';
  return out;
}

function linkP(document, href, text, wrapTag) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  if (wrapTag) {
    const w = document.createElement(wrapTag);
    w.append(a);
    p.append(w);
  } else {
    p.append(a);
  }
  return p;
}

function cleanP(src, document) {
  const p = document.createElement('p');
  const clone = src.cloneNode(true);
  clone.querySelectorAll('svg').forEach((s) => s.remove());
  clone.querySelectorAll('a').forEach((a) => {
    const n = document.createElement('a');
    n.href = a.getAttribute('href') || '';
    n.textContent = a.textContent.trim();
    a.replaceWith(n);
  });
  p.innerHTML = clone.innerHTML.trim();
  return p;
}

export default function parse(element, { document }) {
  const row = element.querySelector('div.sc-f23d7fd5-8');
  const cols = row ? [...row.children] : [];
  const textCol = cols.find((c) => c.querySelector('h1')) || cols[0] || element;
  const mediaCol = cols.find((c) => c !== textCol && c.querySelector('img')) || null;

  const options = [];
  const text = [];

  // eyebrow + heading
  const h1 = textCol.querySelector('h1');
  const eyebrow = textCol.querySelector(':scope > p[id^="title-"]');
  if (eyebrow && eyebrow.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = eyebrow.textContent.trim();
    text.push(p);
  }
  if (h1) {
    const h = document.createElement('h1');
    h.textContent = h1.textContent.trim();
    text.push(h);
  }

  // lede
  textCol.querySelectorAll(':scope > div[id^="text-"] > p, :scope > div[id^="text-"] > ul').forEach((n) => {
    if (n.textContent.trim()) text.push(n.tagName === 'UL' ? n.cloneNode(true) : cleanP(n, document));
  });

  // trial email form
  const form = textCol.querySelector('form');
  if (form) {
    options.push('trial');
    const note = [...form.querySelectorAll('p')].find((p) => p.querySelector('strong'));
    if (note) text.push(cleanP(note, document));
    const btn = form.querySelector('button[type="submit"], button');
    const label = btn ? btn.textContent.trim() : 'Start your free trial';
    text.push(linkP(document, '/register', label, 'strong'));
    const tip = form.querySelector('[role="tooltip"]');
    if (tip && tip.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = tip.textContent.trim();
      text.push(p);
    }
    const privacy = [...form.querySelectorAll('p')].find((p) => p !== note && p.querySelector('a'));
    if (privacy) text.push(cleanP(privacy, document));
  }

  // CTA buttons (link group)
  let hasVideo = false;
  const group = textCol.querySelector('[class*="LinkGroupstyle__LinkGroupRoot"]');
  if (group && !form) {
    let first = true;
    [...group.children].forEach((item) => {
      const id = wistiaId(item);
      if (id) {
        hasVideo = true;
        text.push(linkP(document, `https://fast.wistia.net/embed/iframe/${id}`, item.textContent.trim(), first ? 'strong' : 'em'));
        first = false;
        return;
      }
      const a = item.matches('a') ? item : item.querySelector('a');
      if (!a || !a.textContent.trim()) return;
      text.push(linkP(document, a.getAttribute('href'), a.textContent.trim(), first ? 'strong' : 'em'));
      first = false;
    });
  }

  // media column
  const media = [];
  let posterId = '';
  if (mediaCol) {
    const img = realImg(mediaCol, document);
    if (img) media.push(img);
    posterId = wistiaId(mediaCol);
    if (posterId) hasVideo = true;
  }

  if (hasVideo) options.unshift('video');

  const cells = [[text, media]];

  // logos strip (LogoTypeRow)
  const logoRow = element.querySelector('[data-aem-id="aem.components.LogoTypeRow"], [id^="logotyperow-"]');
  if (logoRow) {
    const rowEl = logoRow.closest('div.sc-f23d7fd5-8') || logoRow;
    const h = rowEl.querySelector('h2, h3');
    const track = rowEl.querySelector('div[direction]:not([aria-hidden="true"])') || rowEl;
    const logos = [...track.querySelectorAll('img')].filter((i) => !(i.getAttribute('src') || '').startsWith('data:'));
    if (logos.length) {
      options.push('logos');
      if (h && h.textContent.trim()) {
        const h2 = document.createElement('h2');
        h2.textContent = h.textContent.trim();
        cells.push([[h2], '']);
      }
      logos.forEach((l) => {
        const img = document.createElement('img');
        img.src = l.getAttribute('src');
        img.alt = l.getAttribute('alt') || '';
        cells.push([[img], '']);
      });
    }
  }

  const name = options.length ? `sv-hero (${options.join(', ')})` : 'sv-hero';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);

  if (posterId) {
    block.after(linkP(document, `https://fast.wistia.net/embed/iframe/${posterId}`, 'Play video'));
  }
}
