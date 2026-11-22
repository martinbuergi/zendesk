/**
 * hp-split — text column beside an image column (offset by one column).
 *
 * Authoring (one row): cell 1 — optional eyebrow <p> (a trailing <code> becomes the tag
 * pill), heading (<h2>, or <h3> for the smaller report title), <p> text, CTAs (<strong><a>
 * primary, <em><a> secondary); cell 2 — the image.
 * @variants block: wide (5-column copy, 6-column square image) | default (6 + 5, rounded image)
 * In a section styled `forest` the type turns light.
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isCta = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

export default function decorate(block) {
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((c) => nodes.push(...c.children));
  if (!nodes.length) return;
  const mediaNodes = nodes.filter((n) => mediaOf(n));
  const heading = nodes.find(isHeading);
  const hi = nodes.indexOf(heading);
  const ctas = nodes.filter((n) => !mediaNodes.includes(n) && isCta(n));
  const eyebrow = nodes.find((n, i) => hi > 0 && i < hi && n.tagName === 'P' && !mediaNodes.includes(n));
  const prose = nodes.filter((n) => ![heading, eyebrow, ...ctas, ...mediaNodes].includes(n));

  const copy = el('div', 'za-col hp-split-copy');
  if (eyebrow) copy.append(el('div', 'za-eyebrow hp-split-eyebrow', eyebrow));
  if (heading) copy.append(el('div', 'hp-split-title', heading));
  if (prose.length) copy.append(el('div', 'za-text', ...prose));
  if (ctas.length) copy.append(el('div', 'hp-linkgroup', ...ctas));

  const media = el('div', 'za-col hp-split-media');
  mediaNodes.forEach((n) => {
    const m = mediaOf(n);
    media.append(el('span', 'hp-img', m.closest('p') || m.closest('picture') || m));
  });

  block.classList.add('za-section');
  if (block.closest('.section.forest')) block.classList.add('za-section-forest');
  const row = el('div', 'za-row hp-split-row', copy);
  if (mediaNodes.length) row.append(media);
  block.replaceChildren(el('div', 'za-container', row));
}
