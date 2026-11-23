/* eslint-disable */
/* global WebImporter */

/**
 * sv-columns parser (template service-2).
 * Two source shapes:
 *  1. media split row  div.sc-f23d7fd5-8 (text col + image col)
 *       -> 'sv-columns (media)' or 'sv-columns (media, reverse)' when the image sits left
 *          (text col styled .vAcTu / media col .JVUfo, or media col first in the DOM)
 *       row 1: [ eyebrow <p>, <h2>, body <p>s, CTA <p>s | <img> ]
 *  2. banner card      div.sc-c5fa0909-1
 *       -> 'sv-columns (text, banner)'
 *       row 1: [ <h2>, body <p>, CTA <p><strong><a> ]
 * Matches blocks/sv-columns/sv-columns.js (decorateSplit) and content/why-zendesk.plain.html.
 */
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

function cleanBlock(src, document) {
  const clone = src.cloneNode(true);
  clone.querySelectorAll('svg').forEach((s) => s.remove());
  clone.querySelectorAll('a').forEach((a) => {
    const n = document.createElement('a');
    n.href = a.getAttribute('href') || '';
    n.textContent = a.textContent.trim();
    a.replaceWith(n);
  });
  const tag = /^(UL|OL)$/.test(src.tagName) ? src.tagName : 'p';
  const out = document.createElement(tag);
  out.innerHTML = clone.innerHTML.trim();
  return out;
}

function ctaParagraphs(group, document) {
  const out = [];
  let buttons = 0;
  group.querySelectorAll('a[href]').forEach((a) => {
    const label = a.textContent.trim();
    if (!label) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = label;
    if (/Buttonstyle__ButtonRoot/.test(a.className)) {
      const w = document.createElement(buttons === 0 ? 'strong' : 'em');
      w.append(link);
      p.append(w);
      buttons += 1;
    } else {
      p.append(link);
    }
    out.push(p);
  });
  return out;
}

// walk a text column in document order: heading-style <p> eyebrow, headings, text, link groups
function textContent(col, document) {
  const out = [];
  const visit = (node) => {
    [...node.children].forEach((n) => {
      if (/^H[1-6]$/.test(n.tagName)) {
        if (!n.textContent.trim()) return;
        const h = document.createElement(n.tagName === 'H1' ? 'h2' : n.tagName.toLowerCase());
        h.textContent = n.textContent.trim();
        out.push(h);
      } else if (/LinkGroupstyle__LinkGroupRoot/.test(n.className) || n.matches('a[href]')) {
        if (n.matches('a[href]')) {
          const wrap = document.createElement('div');
          wrap.append(n.cloneNode(true));
          out.push(...ctaParagraphs(wrap, document));
        } else {
          out.push(...ctaParagraphs(n, document));
        }
      } else if (n.tagName === 'P' || n.tagName === 'UL' || n.tagName === 'OL') {
        if (n.textContent.trim()) out.push(cleanBlock(n, document));
      } else if (n.tagName === 'DIV' || n.tagName === 'SPAN') {
        visit(n);
      }
    });
  };
  visit(col);
  return out;
}

export default function parse(element, { document }) {
  // banner card
  if (element.matches('div.sc-c5fa0909-1') || /sc-c5fa0909-1/.test(element.className)) {
    const content = textContent(element, document);
    const block = WebImporter.Blocks.createBlock(document, { name: 'sv-columns (text, banner)', cells: [[content]] });
    element.replaceWith(block);
    return;
  }

  // media split row
  const cols = [...element.children];
  const textCol = cols.find((c) => c.querySelector('h1, h2, h3')) || cols[0];
  const mediaCol = cols.find((c) => c !== textCol && c.querySelector('img')) || null;
  const text = textContent(textCol, document);
  const media = [];
  if (mediaCol) {
    const img = realImg(mediaCol, document);
    if (img) media.push(img);
  }

  const reverse = !!mediaCol && (
    textCol.classList.contains('vAcTu')
    || mediaCol.classList.contains('JVUfo')
    || cols.indexOf(mediaCol) < cols.indexOf(textCol)
  );
  const name = reverse ? 'sv-columns (media, reverse)' : 'sv-columns (media)';
  const block = WebImporter.Blocks.createBlock(document, { name, cells: [[text, media]] });
  element.replaceWith(block);
}
