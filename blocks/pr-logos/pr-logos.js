/**
 * pr-logos — "Trusted by teams everywhere." logo row: a continuous linear marquee (live: the
 * authored logos + one presentational copy, translateX(-50%) loop, 40 s per loop; paused under
 * prefers-reduced-motion). Schema: stardust/eds-schema/pricing.json section 7.
 *
 * Authoring: <h2> (head row), then the logo images (one cell, or one per row/cell).
 * The marquee copy is presentational: alt="", aria-hidden, instrumentation stripped (EW4).
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

function stripInstrumentation(node) {
  node.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  node.removeAttribute('data-prose-index');
  node.removeAttribute('data-image-index');
  return node;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const head = el('div', 'pr-logos-head');
  const track = el('div', 'pr-logos-track');
  const logos = [];
  nodes.forEach((n) => {
    if (n.matches('picture, img') || n.querySelector('picture, img')) {
      const item = wrapNode(n, 'pr-logos-item');
      logos.push(item);
      track.append(item);
    } else head.append(n);
  });
  logos.forEach((item) => {
    const copy = stripInstrumentation(item.cloneNode(true));
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    track.append(copy);
  });
  const marquee = el('div', 'pr-logos-marquee');
  marquee.append(track);
  const container = el('div', 'za-container');
  if (head.children.length) container.append(head);
  container.append(marquee);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
