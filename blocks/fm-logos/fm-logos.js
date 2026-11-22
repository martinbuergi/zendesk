/**
 * fm-logos — form-template customer-logo strip at the foot of the hero band (live /free-trial/
 * #teaser-41a5620055-2: label left, logo marquee right, on the hero's lime glow; stacked and
 * centred below 1150 px).
 *
 * Authoring (one cell, or one element per row/cell): <h2> label, then one image per logo
 * (alt = company name). The marquee copy is presentational: alt="", aria-hidden, instrumentation
 * stripped (EW4).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function stripInstrumentation(node) {
  [node, ...node.querySelectorAll('[data-prose-index], [data-image-index]')].forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  return node;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const label = el('div', 'fm-logos-label');
  const track = el('div', 'fm-logos-track');
  const set = el('div', 'fm-logos-set');
  nodes.forEach((n) => {
    if (n.querySelector('picture, img') && !n.textContent.trim()) set.append(n);
    else label.append(n);
  });
  const copy = stripInstrumentation(set.cloneNode(true));
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('img').forEach((i) => { i.alt = ''; });
  track.append(set, copy);
  const viewport = el('div', 'fm-logos-viewport');
  viewport.append(track);
  const row = el('div', 'fm-logos-row');
  row.append(label, viewport);
  const container = el('div', 'za-container');
  container.append(row);
  block.replaceChildren(container);
}
