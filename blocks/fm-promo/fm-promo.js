/**
 * fm-promo — form-template body promo band (live /free-trial/ #teaser-3fd06df4b4: a forest card,
 * radius 40, cream title + text on the left, lime CTA on the right, in a padded white section).
 *
 * Authoring: one cell — the title heading, optional text <p>(s), CTA <p>(s)
 *   (<strong><a> primary, <em><a> secondary).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

const isCta = (n) => n.tagName === 'P' && !!n.querySelector('a[href]')
  && (n.classList.contains('button-wrapper') || !!n.querySelector('strong > a, em > a, a.button'));

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const card = el('div', 'fm-promo-card');
  const body = el('div', 'fm-promo-body');
  const links = el('div', 'fm-promo-links');
  nodes.forEach((n) => (isCta(n) ? links : body).append(n));
  card.append(body);
  if (links.children.length) card.append(links);
  const container = el('div', 'za-container');
  container.append(card);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
