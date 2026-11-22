/**
 * hp-logos — customer-logo strip: a label heading and a row of logo images.
 *
 * Authoring (one cell): <h2> label, then one image per logo (alt = company name).
 * Extra cells/rows are folded in order; any other text stays under the label.
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const units = [...block.querySelectorAll('picture, img')]
    .filter((m) => !(m.tagName === 'IMG' && m.closest('picture')))
    .map((m) => m.closest('p') || m);
  const other = [...block.querySelectorAll(':scope > div > div > *')]
    .filter((n) => n !== heading && !units.includes(n) && !n.querySelector('picture, img'));

  block.classList.add('za-section');
  const label = el('div', 'za-col hp-logos-label');
  if (heading) label.append(heading);
  other.forEach((n) => label.append(n));
  const grid = el('div', 'hp-logos-grid', ...units.map((u) => el('span', 'hp-logo', u)));
  const row = el('div', 'za-row hp-logos-row', label, el('div', 'za-col hp-logos-list', grid));
  block.replaceChildren(el('div', 'za-container', row));
}
