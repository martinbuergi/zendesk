/**
 * co-promo — body promo card (live .fvooCG: forest card, radius 40, cream title + lime CTA).
 * Schema: stardust/eds-schema/company.json section 5 (#teaser-7229583713).
 * Authoring: one cell — the title heading (+ optional paragraphs) and the CTA paragraph.
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
  const card = el('div', 'co-promo-card');
  card.setAttribute('role', 'complementary');
  card.setAttribute('aria-label', 'body-promo');
  const body = el('div', 'co-promo-body');
  const links = el('div', 'co-links');
  nodes.forEach((n) => (isCta(n) ? links : body).append(n));
  card.append(body);
  if (links.children.length) card.append(links);
  const container = el('div', 'za-container');
  container.append(card);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
