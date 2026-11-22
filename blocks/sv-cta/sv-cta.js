/**
 * sv-cta — closing call-to-action band (live .gWxblo: ink ground + moss glow, centered
 * eyebrow, display heading, buttons). Schema: stardust/eds-schema/service.json section 9
 * (#teaser-9b6b7949ad).
 *
 * Authoring (one cell, or one element per row): eyebrow <p> (before the heading), <h2>,
 *   optional body <p>, CTA <p>s (<strong><a> primary, <em><a> secondary), an optional
 *   picture (`image` variant: shown above the text below 768px, as on live).
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
  if (block.querySelector(':scope > .sv-cta-glow')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const hIdx = nodes.findIndex((n) => /^H[1-6]$/.test(n.tagName));
  const col = el('div', 'za-col sv-head-col');
  const links = el('div', 'sv-cta-links');
  const media = el('div', 'sv-cta-media');
  nodes.forEach((n, i) => {
    const a = n.querySelector('a');
    if (n.querySelector('picture, img') && !n.textContent.trim()) media.append(n);
    else if (i === hIdx) col.append(wrapNode(n, 'sv-cta-h'));
    else if (a && n.textContent.trim() === a.textContent.trim()) links.append(n);
    else if (hIdx >= 0 && i < hIdx) col.append(wrapNode(n, 'za-eyebrow sv-on-dark'));
    else col.append(wrapNode(n, 'za-text sv-cta-text'));
  });
  if (links.children.length) col.append(links);
  const row = el('div', 'za-row sv-head');
  row.append(col);
  const container = el('div', 'za-container sv-rel');
  if (media.children.length) container.append(media);
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(el('div', 'sv-cta-glow'), container);
}
