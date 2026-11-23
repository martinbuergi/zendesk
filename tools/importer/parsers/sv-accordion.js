/* eslint-disable */
/* global WebImporter */

/**
 * sv-accordion parser (template service-2).
 * Two source shapes:
 *  1. media accordion  section.sc-ceec712a-1 (member pages): media col + accordion col
 *       -> 'sv-accordion', or 'sv-accordion (reverse)' when the list sits left
 *          (media col styled .hPUMno, or accordion col first in the DOM)
 *       one row per item: [ <h3> title | body <p>s (+ CTA <p>) + <img> ]
 *  2. FAQ accordion    div[id^="grid-"] .Accordionstyle__AccordionRoot-sc-1baakjb-1
 *       -> 'sv-accordion (faq)'
 *       one row per item: [ <h3> question | answer <p>s ]
 * Matches blocks/sv-accordion/sv-accordion.js and content/cxtrends|platform|service.
 * The section eyebrow / <h2> stay default content before the block.
 */
const WISTIA_RE = /wistia_async_([a-z0-9]{6,})/i;

function imgSrc(img) {
  let src = img.getAttribute('src') || '';
  if (src && !src.startsWith('data:')) return src;
  const set = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
  const fromSet = (set.split(',').pop() || '').trim().split(/\s+/)[0];
  if (img.getAttribute('data-src')) return img.getAttribute('data-src');
  if (fromSet) return fromSet;
  // next/image keeps the real <img> in a sibling <noscript> until it lazy-loads
  const ns = img.parentElement && img.parentElement.querySelector('noscript');
  if (ns) {
    const m = /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || '');
    if (m && !m[1].startsWith('data:')) return m[1].replace(/&amp;/g, '&');
  }
  return '';
}

function contentImgs(root) {
  return [...root.querySelectorAll('img')].filter((i) => /^image-/.test(i.id || '')
    || !(/^data:image\/svg\+xml/.test(i.getAttribute('src') || '')));
}

function makeImg(document, src, alt) {
  const out = document.createElement('img');
  out.src = src;
  out.alt = alt || '';
  return out;
}

function cleanBlock(src, document) {
  const clone = src.cloneNode(true);
  clone.querySelectorAll('svg, img').forEach((s) => s.remove());
  clone.querySelectorAll('a').forEach((a) => {
    const n = document.createElement('a');
    n.href = a.getAttribute('href') || '';
    n.textContent = a.textContent.trim();
    a.replaceWith(n);
  });
  const tag = /^(UL|OL)$/.test(src.tagName) ? src.tagName : 'p';
  const out = document.createElement(tag);
  out.innerHTML = clone.innerHTML.replace(/&nbsp;/g, ' ').trim();
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
  } else p.append(a);
  return p;
}

function panelBody(panel, document) {
  const out = [];
  panel.querySelectorAll('[class*="Textstyle__TextRoot"] > p, [class*="Textstyle__TextRoot"] > ul, [class*="Textstyle__TextRoot"] > ol')
    .forEach((n) => { if (n.textContent.trim()) out.push(cleanBlock(n, document)); });
  // CTAs inside the panel (buttons, Wistia video buttons)
  panel.querySelectorAll('[class*="LinkGroupstyle__LinkGroupRoot"] > *, [class*="VideoLinkstyle__VideoLinkRoot"]').forEach((item) => {
    if (item.closest('[class*="Textstyle__TextRoot"]')) return;
    const wm = WISTIA_RE.exec((item.querySelector('[class*="wistia_async_"]') || item).className || '');
    if (wm) {
      const label = item.textContent.trim() || 'Watch video';
      if (!out.some((p) => p.textContent === label)) out.push(linkP(document, `https://fast.wistia.net/embed/iframe/${wm[1]}`, label, 'em'));
      return;
    }
    const a = item.matches('a[href]') ? item : item.querySelector('a[href]');
    if (a && a.textContent.trim()) out.push(linkP(document, a.getAttribute('href'), a.textContent.trim(), /Buttonstyle__ButtonRoot/.test(a.className) ? 'strong' : null));
  });
  // Standalone CTA anchors placed directly in the panel (not in a link group or text block)
  panel.querySelectorAll('a[href][data-aem-id="aem.components.Button"]').forEach((a) => {
    if (a.closest('[class*="Textstyle__TextRoot"], [class*="LinkGroupstyle__LinkGroupRoot"], [class*="VideoLinkstyle__VideoLinkRoot"], [class*="Accordionstyle__AccordionMediaMobile"]')) return;
    const label = a.textContent.trim();
    if (!label || out.some((p) => p.textContent === label)) return;
    out.push(linkP(document, a.getAttribute('href'), label, /Buttonstyle__ButtonRoot/.test(a.className) ? 'strong' : null));
  });
  return out;
}

export default function parse(element, { document }) {
  const acc = element.matches('[class*="Accordionstyle__AccordionRoot"]')
    ? element
    : element.querySelector('[class*="Accordionstyle__AccordionRoot"]');
  const sections = acc ? [...acc.querySelectorAll(':scope > [class*="Accordionstyle__AccordionSection"]')] : [];

  // media accordion: desktop media column images, in item order
  const isMediaShape = element.matches('section.sc-ceec712a-1') || /sc-ceec712a-1/.test(element.className);
  let desktopImgs = [];
  let reverse = false;
  if (isMediaShape && acc) {
    const row = acc.closest('[class*="Gridstyle__Row"]');
    const cols = row ? [...row.children] : [];
    const accCol = cols.find((c) => c.contains(acc));
    const mediaCol = cols.find((c) => c !== accCol && c.querySelector('img'));
    if (mediaCol) {
      desktopImgs = [...mediaCol.querySelectorAll('.sc-ceec712a-0')].map((box) => contentImgs(box)[0]).filter(Boolean);
      if (!desktopImgs.length) desktopImgs = contentImgs(mediaCol);
      reverse = mediaCol.classList.contains('hPUMno') || cols.indexOf(accCol) < cols.indexOf(mediaCol);
    }
  }

  const cells = [];
  sections.forEach((sec, i) => {
    const h = sec.querySelector('[class*="Accordionstyle__AccordionHeader"] h1, [class*="Accordionstyle__AccordionHeader"] h2, [class*="Accordionstyle__AccordionHeader"] h3, [class*="Accordionstyle__AccordionHeader"] h4')
      || sec.querySelector('h3');
    const title = document.createElement('h3');
    title.textContent = h ? h.textContent.trim() : '';
    if (!title.textContent) return;

    const panel = sec.querySelector('[class*="Accordionstyle__AccordionPanel"]') || sec;
    const body = panelBody(panel, document);

    if (isMediaShape) {
      const mobile = panel.querySelector('[class*="Accordionstyle__AccordionMediaMobile"]');
      const candidates = [];
      const m = mobile && contentImgs(mobile)[0];
      if (m) candidates.push(m);
      if (m && m.id) {
        const twin = desktopImgs.find((d) => d.id === m.id);
        if (twin) candidates.push(twin);
      }
      if (desktopImgs[i]) candidates.push(desktopImgs[i]);
      const withSrc = candidates.find((c) => imgSrc(c));
      if (withSrc) body.push(makeImg(document, imgSrc(withSrc), withSrc.getAttribute('alt')));
      else if (candidates[0]) body.push(makeImg(document, candidates[0].getAttribute('src') || '', candidates[0].getAttribute('alt')));
    }

    cells.push([[title], body]);
  });

  let name = 'sv-accordion (faq)';
  if (isMediaShape) name = reverse ? 'sv-accordion (reverse)' : 'sv-accordion';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
