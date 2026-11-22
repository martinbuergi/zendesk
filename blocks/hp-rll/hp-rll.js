/**
 * hp-rll — resolution learning loop: a centred section head, then a vertical timeline of
 * steps (title, animation frame, static image) around a sticky dot.
 *
 * Authoring: the section head (<h2>, <p>, CTA <strong><a>) is default content before the
 * block (reabsorbed — EW8; leading heading rows without images are the fallback).
 * Rows: <h3> step title | animation image (>= 768) | static image (< 768).
 * Emphasis in the heading (<em>) takes the accent colour.
 */

const DOT_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="currentColor" viewBox="0 0 17 16"><path fill="currentColor" d="M7.026 15.336c.086.388.43.664.828.664a3.285 3.285 0 0 0 3.284-3.285V10.5h2.897a2 2 0 0 0 1.982-2.266l-.815-6.067A2.5 2.5 0 0 0 12.724 0H8.766a4.75 4.75 0 0 0-2.488.704L4 2.105v7.547l.41.11a2.5 2.5 0 0 1 1.794 1.873z"></path><path fill="currentColor" d="M3 11V1H0v10z"></path></svg>';

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isCta = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();
const unit = (m) => m.closest('p') || m.closest('picture') || m;

function takeHead(block, rows) {
  const wrap = block.parentElement && block.parentElement.previousElementSibling;
  if (wrap && wrap.classList.contains('default-content-wrapper')) {
    const nodes = [...wrap.children];
    wrap.remove();
    return nodes;
  }
  const nodes = [];
  while (rows.length && !rows[0].querySelector('picture, img') && rows[0].querySelector('h2, p')
    && !(rows[0].querySelector('h3') && rows[0].children.length > 1)) {
    const r = rows.shift();
    r.querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

function buildHead(nodes) {
  if (!nodes.length) return null;
  const heading = nodes.find(isHeading);
  const ctas = nodes.filter(isCta);
  const prose = nodes.filter((n) => n !== heading && !ctas.includes(n));
  const col = el('div', 'za-col hp-center-col');
  if (heading) col.append(el('div', 'hp-head-title', heading));
  if (prose.length) col.append(el('div', 'za-text', ...prose));
  if (ctas.length) col.append(el('div', 'hp-linkgroup hp-linkgroup-center', ...ctas));
  return el('div', 'za-row hp-center-row', col);
}

export default function decorate(block) {
  const rows = [...block.children];
  const head = buildHead(takeHead(block, rows));

  const track = el('div', 'hp-rll-track', el('div', 'hp-rll-line'));
  const dot = el('div', 'hp-rll-dot');
  const dotInner = el('div', 'hp-rll-dot-inner');
  dotInner.innerHTML = DOT_SVG;
  dot.append(el('div', '', dotInner));
  track.append(dot);

  const steps = rows.filter((r) => r.textContent.trim() || r.querySelector('picture, img'));
  steps.forEach((r, i) => {
    const nodes = [];
    r.querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
    const heading = nodes.find(isHeading);
    const media = nodes.filter((n) => mediaOf(n)).map((n) => unit(mediaOf(n)));
    const rest = nodes.filter((n) => n !== heading && !nodes.filter((x) => mediaOf(x)).includes(n));
    const step = el('div', 'hp-rll-block');
    step.id = `rll-block-${i + 1}`;
    if (i === 1 || (steps.length === 1 && i === 0)) step.classList.add('is-active');
    if (heading) step.append(el('div', 'hp-rll-title', heading));
    rest.forEach((n) => step.append(n));
    const box = el('div', 'hp-rll-media');
    if (media[0]) box.append(el('div', 'hp-rll-anim', media[0]));
    if (media[1]) box.append(el('div', 'hp-rll-still', media[1]));
    if (media.length === 1) box.classList.add('hp-rll-single');
    step.append(box);
    track.append(step);
  });

  block.classList.add('za-section');
  const container = el('div', 'za-container za-row-gap', head, track);
  block.replaceChildren(container);
}
