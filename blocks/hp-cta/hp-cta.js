/**
 * hp-cta — centred call-to-action: heading, optional text, CTAs.
 *
 * Authoring (one cell): <h2>, <p> text, CTAs (<strong><a> primary, <em><a> secondary).
 * @variants block: banner (forest band, launch icon before the heading, on-dark secondary)
 *   | default (cream rounded card)
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const isCta = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

export default function decorate(block) {
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((c) => nodes.push(...c.children));
  if (!nodes.length) return;
  const heading = nodes.find(isHeading);
  const ctas = nodes.filter(isCta);
  const prose = nodes.filter((n) => n !== heading && !ctas.includes(n));

  const col = el('div', 'za-col hp-cta-col');
  if (heading) col.append(el('div', 'hp-cta-title', heading));
  if (prose.length) col.append(el('div', 'za-text', ...prose));
  if (ctas.length) col.append(el('div', 'hp-linkgroup hp-linkgroup-center', ...ctas));

  block.classList.add('za-section');
  if (block.closest('.section.forest')) block.classList.add('za-section-forest');
  const card = el('div', 'hp-cta-card', el('div', 'za-row hp-center-row', col));
  block.replaceChildren(el('div', 'za-container', card));
}
