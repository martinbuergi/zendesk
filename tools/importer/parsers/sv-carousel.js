/* eslint-disable */
/* global WebImporter */

/**
 * sv-carousel parser (template service-2).
 * Source: div:has(> .Carouselstyle__CarouselSlider-sc-1mnw5o8-3) (slick resource-card slider).
 * Each slide is a whole-card <a> (LinkCard) holding an image, a kind label and a title.
 *
 * Output (matches blocks/sv-carousel/sv-carousel.js and content/service.plain.html):
 *   one row per card: [ <img> | kind <p>, title <p><a href>Title</a></p> ]
 * No options.
 */
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

const txt = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');

export default function parse(element, { document }) {
  let slides = [...element.querySelectorAll('.slick-slide:not(.slick-cloned)')];
  if (!slides.length) slides = [...element.querySelectorAll('a[class*="LinkCard"]')];

  const cells = [];
  slides.forEach((slide) => {
    const card = slide.matches('a[href]') ? slide : (slide.querySelector('a[href]') || slide);
    const href = card.getAttribute('href') || '';
    const content = card.querySelector('[class*="LinkCardstyle__LinkCardContent"]') || card;
    const media = content === card ? card : (card.querySelector('span.sc-fdfb305c-0') || card);
    const img = realImg(media, document);

    const ps = [...content.querySelectorAll('p')].filter((p) => txt(p));
    const titleEl = ps.length > 1 ? ps[ps.length - 1] : ps[0];
    const kindEl = ps.length > 1 ? ps[0] : null;

    const text = [];
    if (kindEl) {
      const p = document.createElement('p');
      p.textContent = txt(kindEl);
      text.push(p);
    }
    if (titleEl) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = txt(titleEl);
      p.append(a);
      text.push(p);
    }
    if (!text.length && !img) return;
    cells.push([img ? [img] : '', text]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'sv-carousel', cells });
  element.replaceWith(block);
}
