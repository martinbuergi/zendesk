/**
 * co-cta — closing CTA band (live .gWxblo: ink ground, moss glow, centred cream title + lime CTA).
 * Schema: stardust/eds-schema/company.json section 7 (#teaser-3c654c6cbf).
 * Authoring: one cell — the heading (+ optional paragraphs) and the CTA paragraph(s).
 * @variants class: lg (default none)
 *   lg = display-size title (live h2 at the h1 scale, 68 px at 1440)
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
  const col = el('div', 'za-col co-head-col');
  const body = el('div', 'za-text co-text');
  const links = el('div', 'co-links');
  nodes.forEach((n) => {
    if (/^H[1-6]$/.test(n.tagName)) col.append(n);
    else if (isCta(n)) links.append(n);
    else body.append(n);
  });
  if (body.children.length) col.append(body);
  if (links.children.length) col.append(links);
  const row = el('div', 'za-row co-head');
  row.append(col);
  const container = el('div', 'za-container co-rel');
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(el('div', 'co-glow'), container);
}
