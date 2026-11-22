/**
 * bl-promo — listing promo cards (hubs): one card per row — image(s) | heading + text | CTAs.
 *
 * Authoring (one row per card, any cell split): <p><img></p> | <h2|h4> + <p> | <p><strong><a>
 *   primary</a></strong></p> <p><em><a>secondary</a></em></p>.
 * Variants: text-only (dark card, no image), band (full-bleed closing band), pair (two light
 *   cards side by side / stacked beside a list), legacy (gen-B type and buttons).
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isCta = (n) => n.tagName === 'P' && n.querySelector('a')
  && n.textContent.trim() === n.querySelector('a').textContent.trim();

/** a single-paragraph cell is delivered as bare text: give it back its <p> */
function cellKids(cell) {
  if (!cell.children.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    cell.append(p);
  }
  return [...cell.children];
}

export default function decorate(block) {
  const cards = [...block.children].map((row) => {
    const nodes = [];
    [...row.children].forEach((c) => nodes.push(...cellKids(c)));
    if (!nodes.length) return null;
    const media = nodes.filter((n) => mediaOf(n) && !n.textContent.trim());
    const ctas = nodes.filter((n) => !media.includes(n) && isCta(n));
    const copy = nodes.filter((n) => !media.includes(n) && !ctas.includes(n));
    const card = el('div', 'bl-promo-card');
    if (media.length) card.append(el('div', 'bl-promo-img', ...media));
    card.append(el('div', 'bl-promo-copy', ...copy));
    if (ctas.length) card.append(el('div', 'bl-promo-cta', ...ctas));
    return card;
  }).filter(Boolean);
  block.classList.add('za-section');
  block.replaceChildren(el('div', 'za-container bl-promo-cards', ...cards));
}
