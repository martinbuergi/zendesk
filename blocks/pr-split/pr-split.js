/**
 * pr-split — media/text split row (live forethought / startups / ROI teasers): text column
 * 6/12 beside a rounded image 5/12. Schema: stardust/eds-schema/pricing.json sections 5, 6, 8.
 *
 * Authoring: cell 1 = optional eyebrow <p> BEFORE the <h2> (an <em> inside renders as the lime
 *   tag, e.g. NEW), <h2>, body <p>s, CTA <p>s (<strong><a> primary, <em><a> outlined);
 *   cell 2 = the image, shown at its own ratio (4:3 photos, 1:1 graphics) in a rounded frame.
 * @variants block: dark (ink band, on-dark text and buttons) | reverse (image left) (default none)
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
  if (block.querySelector(':scope > .za-container')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const hIdx = nodes.findIndex((n) => /^H[1-6]$/.test(n.tagName));
  const text = el('div', 'za-col pr-split-text');
  const media = el('div', 'za-col pr-split-media');
  const frame = el('div', 'pr-media');
  const body = el('div', 'za-text pr-split-body');
  const btns = el('div', 'pr-split-btns');
  nodes.forEach((n, i) => {
    const a = n.querySelector('a');
    if (n.matches('picture, img') || n.querySelector('picture, img')) frame.append(n);
    else if (i === hIdx) text.append(wrapNode(n, 'pr-split-h'));
    else if (hIdx >= 0 && i < hIdx) text.append(wrapNode(n, 'za-eyebrow pr-split-eyebrow'));
    else if (a && n.textContent.trim() === a.textContent.trim()) btns.append(n);
    else body.append(n);
  });
  if (body.children.length) text.append(body);
  if (btns.children.length) text.append(btns);
  if (frame.children.length) media.append(frame);
  const row = el('div', 'za-row pr-split-row');
  row.append(text, media);
  const container = el('div', 'za-container');
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
