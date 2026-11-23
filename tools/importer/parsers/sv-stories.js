/* eslint-disable */
/* global WebImporter */

/**
 * sv-stories parser (template service-2).
 * Source: div.sc-612b179e-0 (slick quote carousel, #quoteCarouselWrapper).
 * Slick repeats slides for looping (.slick-cloned); only unique slides are authored.
 *
 * Output (matches blocks/sv-stories/sv-stories.js and content/service.plain.html):
 *   one row per story:
 *     [ logo <img> (alt = customer), per stat <p><strong>figure</strong></p><p>label</p>
 *     | <blockquote><p>quote</p></blockquote>, name <p>, role <p>, story link <p><a> ]
 * Options: single when the carousel holds one story.
 */
function realImg(root, document) {
  const imgs = [...root.querySelectorAll('img')];
  const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute('src') || '') && !i.id;
  const pick = imgs.find((i) => !isSizer(i));
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

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

export default function parse(element, { document }) {
  const slides = [...element.querySelectorAll('.slick-slide:not(.slick-cloned)')];
  let stories = slides.map((s) => s.querySelector('.sc-8c256214-0') || s).filter((s) => s.querySelector('blockquote'));
  if (!stories.length) {
    // no slick wrapper: dedupe story roots by quote text
    const seen = new Set();
    stories = [...element.querySelectorAll('.sc-8c256214-0')].filter((s) => {
      const k = txt(s.querySelector('blockquote'));
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  const cells = [];
  stories.forEach((story) => {
    const aside = [];
    const logoBox = story.querySelector('.sc-8c256214-2') || story;
    const logo = realImg(logoBox, document);
    if (logo) aside.push(logo);
    story.querySelectorAll('[class*="Statstyle__StatRoot"]').forEach((stat) => {
      const fig = stat.querySelector('.stat-figure') || stat.querySelector('p');
      const label = stat.querySelector('.stat-headline') || stat.querySelectorAll('p')[1];
      if (txt(fig)) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = txt(fig).replace(/\s+/g, '');
        p.append(strong);
        aside.push(p);
      }
      if (txt(label)) aside.push(para(document, txt(label)));
    });

    const body = [];
    const bq = story.querySelector('blockquote');
    if (bq) {
      const clone = bq.cloneNode(true);
      clone.querySelectorAll('cite').forEach((c) => c.remove());
      const quote = txt(clone);
      if (quote) {
        const b = document.createElement('blockquote');
        b.append(para(document, quote));
        body.push(b);
      }
    }
    const cite = story.querySelector('cite') || story;
    const people = [...cite.querySelectorAll('p')].filter((p) => txt(p));
    people.forEach((p) => body.push(para(document, txt(p))));
    // the block names logo tabs from the logo alt; replace a generic source alt ("Next")
    // with the company from the role line ("... at Best Egg")
    if (logo && (!logo.alt || /^(next|previous|prev|logo|image)$/i.test(logo.alt.trim()))) {
      const m = / at (.+)$/.exec(txt(people[people.length - 1]));
      if (m) logo.alt = m[1].trim();
    }
    cite.querySelectorAll('a[href]').forEach((a) => {
      if (!txt(a)) return;
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = txt(a);
      p.append(link);
      body.push(p);
    });

    cells.push([aside, body]);
  });

  const name = cells.length === 1 ? 'sv-stories (single)' : 'sv-stories';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
