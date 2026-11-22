/**
 * hp-teaser — dark promo card: square image, heading + text, CTA.
 *
 * Authoring (one row, any cell split): image | <h2> + <p> | CTA <strong><a>.
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isCta = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

export default function decorate(block) {
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((c) => nodes.push(...c.children));
  if (!nodes.length) return;
  const media = nodes.filter((n) => mediaOf(n));
  const ctas = nodes.filter((n) => !media.includes(n) && isCta(n));
  const copyNodes = nodes.filter((n) => !media.includes(n) && !ctas.includes(n));

  const card = el('div', 'hp-teaser-card');
  card.setAttribute('role', 'complementary');
  card.setAttribute('aria-label', 'body-promo');
  if (media.length) {
    const m = mediaOf(media[0]);
    card.append(el('div', 'hp-teaser-img', el('span', 'hp-img', m.closest('p') || m.closest('picture') || m)));
  }
  card.append(el('div', 'hp-teaser-copy', ...copyNodes));
  if (ctas.length) card.append(el('div', 'hp-teaser-cta', ...ctas));

  block.classList.add('za-section');
  block.replaceChildren(el('div', 'za-container', card));
}
