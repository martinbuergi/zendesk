/**
 * co-linklist — columns of headed link lists (live /sitemap/: heading, then 3 columns of
 * <h3> + bulleted links per row, one column below 768 px).
 *
 * Section head: default content before the block (<h2>) is reabsorbed into the head row (EW8).
 * Authoring: one row per column — one cell: <h3> + <ul> of links.
 * @variants class: legacy (default none) — legacy = gen-B type (Sharp Sans heads, Proxima Nova
 *   teal links, 174 px top padding under the overlapping legacy header)
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'co-ll-head');
  row.append(...wrapper.children);
  wrapper.remove();
  return row;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .co-ll-container')) return;
  const head = buildHead(block);
  const grid = el('div', 'co-ll-grid');
  [...block.children].forEach((r) => {
    const nodes = [...r.children].flatMap((c) => [...c.children]);
    if (!nodes.length) return;
    const col = el('div', 'co-ll-col');
    col.append(...nodes);
    grid.append(col);
  });
  const container = el('div', 'co-ll-container');
  if (head) container.append(head);
  container.append(grid);
  block.replaceChildren(container);
}
