/**
 * pr-final — closing call-to-action band (live gWxblo: ink ground + moss radial glow, centered
 * heading and buttons). Schema: stardust/eds-schema/pricing.json section 10 (#final-callout).
 *
 * Authoring (one cell, or one element per row): <h2>, optional body <p>, CTA <p>s
 *   (<strong><a> primary, <em><a> outlined on dark).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function wrapNode(node, className) {
  const w = el('div', className);
  w.append(node);
  return w;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .pr-final-glow')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const col = el('div', 'pr-final-col');
  const btns = el('div', 'pr-final-btns');
  nodes.forEach((n) => {
    const a = n.querySelector('a');
    if (/^H[1-6]$/.test(n.tagName)) col.append(wrapNode(n, 'pr-final-h'));
    else if (a && n.textContent.trim() === a.textContent.trim()) btns.append(n);
    else col.append(wrapNode(n, 'za-text pr-final-text'));
  });
  if (btns.children.length) col.append(btns);
  const container = el('div', 'za-container pr-final-inner');
  container.append(col);
  block.classList.add('za-section');
  block.replaceChildren(el('div', 'pr-final-glow'), container);
}
