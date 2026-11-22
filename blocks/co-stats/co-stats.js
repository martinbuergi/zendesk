/**
 * co-stats — split text section with a stats row (live "What is Zendesk used for?": heading 4/12 |
 * checked list 8/12, full-width copy, centred StatGroup).
 *
 * Authoring (rows, classified by shape — content is never indexed):
 *   [heading | list or paragraphs]  2 cells, the first holding a heading: split row
 *   [paragraphs]                    1 cell: full-width copy row
 *   [figure | label]                2 cells without a heading: one stat (figure e.g. 5,000+)
 * Stats are gathered into one centred group after the text rows. A figure's trailing non-digit
 * characters (+, %, K…) are set smaller (the authored text node is split, its text unchanged).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function kids(cell) {
  if (!cell) return [];
  if (cell.children.length) return [...cell.children];
  if (!cell.textContent.trim()) return [];
  // HARNESS-ONLY fallback: wrap the cell's text nodes (never fires on DA content)
  const p = el('p');
  p.append(...cell.childNodes);
  return [p];
}

// split a trailing unit (+, %, K, M…) off the figure's last text node into a smaller span
function markUnit(p) {
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let last = null;
  while (walker.nextNode()) last = walker.currentNode;
  if (!last) return;
  const m = last.textContent.match(/^(.*\d)([^\d\s]+)\s*$/s);
  if (!m) return;
  const unit = last.splitText(m[1].length);
  const span = el('span', 'co-stat-unit');
  unit.replaceWith(span);
  span.append(unit);
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const container = el('div', 'za-container za-row-gap co-stats-body');
  const group = el('div', 'co-stat-group');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const first = kids(cells[0]);
    if (cells.length > 1 && first.some((n) => /^H[1-6]$/.test(n.tagName))) {
      const r = el('div', 'za-row co-split');
      const a = el('div', 'za-col co-split-head');
      a.append(...first);
      const b = el('div', 'za-col za-text co-split-body');
      b.append(...kids(cells[1]));
      r.append(a, b);
      container.append(r);
    } else if (cells.length > 1) {
      const stat = el('div', 'co-stat');
      const fig = el('div', 'co-stat-figure');
      fig.append(...first);
      fig.querySelectorAll('p').forEach(markUnit);
      const lab = el('div', 'co-stat-label');
      lab.append(...kids(cells[1]));
      stat.append(fig, lab);
      const box = el('div', 'co-stat-box');
      box.append(stat);
      group.append(box);
    } else if (first.length) {
      const r = el('div', 'za-row');
      const c = el('div', 'za-col za-text co-copy');
      c.append(...first);
      r.append(c);
      container.append(r);
    }
  });
  if (group.children.length) {
    const r = el('div', 'za-row');
    const c = el('div', 'za-col');
    c.append(group);
    r.append(c);
    container.append(r);
  }
  block.classList.add('za-section');
  block.replaceChildren(container);
}
