/**
 * hp-duo — centred heading over a two-up grid of cards (image, title, text, CTAs).
 *
 * Authoring: the heading is default content before the block (reabsorbed, EW8; a leading
 * heading-only row is the fallback). Rows: image | <h3> title, <p> text, CTAs
 * (<strong><a> primary, <em><a> secondary).
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

function takeHead(block, rows) {
  const wrap = block.parentElement && block.parentElement.previousElementSibling;
  if (wrap && wrap.classList.contains('default-content-wrapper')) {
    const nodes = [...wrap.children];
    wrap.remove();
    return nodes;
  }
  const nodes = [];
  while (rows.length && rows[0].querySelector('h1, h2') && !rows[0].querySelector('picture, img')) {
    rows.shift().querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headNodes = takeHead(block, rows);
  block.classList.add('za-section');
  const container = el('div', 'za-container za-row-gap');
  if (headNodes.length) {
    const col = el('div', 'za-col hp-center-col');
    headNodes.forEach((n) => col.append(isHeading(n) ? el('div', 'hp-head-title', n) : n));
    container.append(el('div', 'za-row hp-center-row', col));
  }
  const grid = el('div', 'hp-duo-grid');
  rows.forEach((r) => {
    const nodes = [];
    r.querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
    if (!nodes.length) return;
    const mediaNode = nodes.find((n) => mediaOf(n));
    const heading = nodes.find(isHeading);
    const ctas = nodes.filter((n) => n !== mediaNode && isCta(n));
    const prose = nodes.filter((n) => ![mediaNode, heading, ...ctas].includes(n));
    const card = el('div', 'hp-card');
    if (mediaNode) {
      const m = mediaOf(mediaNode);
      card.append(el('div', 'hp-card-media', m.closest('p') || m.closest('picture') || m));
    }
    const body = el('div', 'hp-card-body');
    if (heading) body.append(el('div', 'hp-card-title', heading));
    if (prose.length) body.append(el('div', 'za-text', ...prose));
    if (ctas.length) body.append(el('div', 'hp-linkgroup', ...ctas));
    card.append(body);
    grid.append(el('div', 'hp-duo-cell', card));
  });
  container.append(grid);
  block.replaceChildren(container);
}
