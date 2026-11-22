/**
 * co-logos — customer logo row (live LogotypeRow basic: centred heading, logos 48 px tall,
 * space-around from 768 px, centred wrap below).
 *
 * Section head: default content before the block (<h2>) is reabsorbed into a centred head
 * row (EW8).
 * Authoring: one row per logo — one cell with the image (alt = company name).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'za-row co-head');
  const col = el('div', 'za-col co-head-col');
  col.append(...wrapper.children);
  wrapper.remove();
  row.append(col);
  return row;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const list = el('div', 'co-logos-row');
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    cell.querySelectorAll('picture, img').forEach((m) => {
      if (m.tagName === 'IMG' && m.closest('picture')) return;
      const item = el('div', 'co-logo');
      item.append(m);
      list.append(item);
    });
  });
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(list);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
