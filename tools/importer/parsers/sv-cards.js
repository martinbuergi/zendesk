/* eslint-disable */
/* global WebImporter */

/**
 * sv-cards parser (template service-2).
 * Source: div[id^="grid-"]:has(.Cardstyle__CardRoot-sc-12jokda-2) inside a service section.
 *
 * Output (matches blocks/sv-cards/sv-cards.js and content/service|why-zendesk|platform):
 *   one row per card: [ icon <img> | <h3> title + text <p>s + optional link <p><a> ]
 * Options: cols-3 when the grid holds exactly three cards (as authored on /platform).
 * The section eyebrow and <h2> stay default content before the block.
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
  const out = document.createElement(src.tagName === 'UL' || src.tagName === 'OL' ? src.tagName : 'p');
  out.innerHTML = clone.innerHTML.trim();
  return out;
}

export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.Cardstyle__CardRoot-sc-12jokda-2')];
  const cells = [];

  cards.forEach((card) => {
    const media = card.querySelector('[class*="Cardstyle__CardMedia"]') || card;
    const img = realImg(media, document);

    const content = [];
    const title = card.querySelector('h1, h2, h3, h4, h5, h6');
    if (title && title.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      content.push(h3);
    }
    // Text is either a Textstyle wrapper holding <p>/<ul>/<ol>, or the Textstyle element is itself the <p>.
    card.querySelectorAll([
      '[class*="Textstyle__TextRoot"] > p', '[class*="Textstyle__TextRoot"] > ul', '[class*="Textstyle__TextRoot"] > ol',
      'p[class*="Textstyle__TextRoot"]', 'ul[class*="Textstyle__TextRoot"]', 'ol[class*="Textstyle__TextRoot"]',
    ].join(', '))
      .forEach((n) => { if (n.textContent.trim()) content.push(cleanBlock(n, document)); });
    // card CTA buttons (direct anchors of the card root)
    card.querySelectorAll(':scope > a[href], :scope > div > a[href]').forEach((a) => {
      if (media.contains(a) || !a.textContent.trim()) return;
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      p.append(link);
      content.push(p);
    });

    cells.push([img ? [img] : '', content]);
  });

  const name = cards.length === 3 ? 'sv-cards (cols-3)' : 'sv-cards';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
