/**
 * fm-features — form-template icon cards (live /free-trial/ #teaser-5954bbc433 "What's included":
 * centred head, three centred cards — 64 px icon, title, text; stacked below 768 px).
 *
 * Section head: default content before the block (<h2>, lede <p>) is reabsorbed (EW8).
 * Authoring: one row per card — cell 1: the icon <picture>; cell 2: <h3> title, text <p>(s).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const container = el('div', 'za-container');
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (wrapper && wrapper.classList.contains('default-content-wrapper')) {
    const head = el('div', 'fm-features-head');
    [...wrapper.children].forEach((n) => head.append(n));
    wrapper.remove();
    container.append(head);
  }
  const grid = el('div', 'fm-features-grid');
  [...block.children].forEach((row) => {
    const card = el('div', 'fm-features-card');
    const icon = el('div', 'fm-features-icon');
    const body = el('div', 'fm-features-body');
    [...row.children].flatMap((c) => [...c.children]).forEach((n) => {
      if (n.querySelector('picture, img') && !n.textContent.trim()) icon.append(n);
      else body.append(n);
    });
    if (icon.children.length) card.append(icon);
    card.append(body);
    grid.append(card);
  });
  container.append(grid);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
