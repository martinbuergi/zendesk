/**
 * bl-guides — "Popular guides" cream band: intro (title + text) left, a 2/3-column link list right.
 *
 * Authoring (one row, any cell split): <h2>title</h2> <p>text</p> | <ul><li><a>guide</a></li>…</ul>
 *
 * Variants (listing hubs): with two cells the second cell is the list column, kept in order —
 *   (plain)  <p><a>link</a></p>… (a link box, 2 columns)
 *   grouped  <h2>group</h2> <p><a>link</a></p>… per group (regions, 3-column groups)
 *   dated    <p>date</p> <p><a>title</a></p> pairs, then a closing <p><a>View all</a></p>
 *   legacy   gen-B type
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const isLink = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

function listColumn(nodes, block) {
  const col = el('div', 'za-col bl-guides-list');
  if (block.classList.contains('grouped')) {
    let group = null;
    nodes.forEach((n) => {
      if (isHeading(n) || !group) {
        group = el('div', 'bl-guides-group');
        col.append(group);
      }
      group.append(n);
    });
  } else if (block.classList.contains('dated')) {
    let item = null;
    nodes.forEach((n) => {
      if (!isLink(n)) {
        item = el('div', 'bl-guides-item', el('div', 'bl-guides-date', n));
        col.append(item);
      } else if (item && item.children.length === 1) item.append(n);
      else col.append(el('div', 'bl-guides-more', n));
    });
  } else col.append(...nodes);
  return col;
}

/** a single-paragraph cell is delivered as bare text: give it back its <p> */
function cellKids(cell) {
  if (!cell.children.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    cell.append(p);
  }
  return [...cell.children];
}

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  cells.forEach(cellKids);
  block.classList.add('za-section');
  if (cells.length === 2 && !cells[1].querySelector(':scope > ul, :scope > ol')) {
    block.replaceChildren(el(
      'div',
      'za-container',
      el(
        'div',
        'za-row',
        el('div', 'za-col bl-guides-intro', ...cells[0].children),
        listColumn([...cells[1].children], block),
      ),
    ));
    return;
  }
  const nodes = [];
  cells.forEach((cell) => nodes.push(...cell.children));
  const lists = nodes.filter((n) => n.matches('ul, ol'));
  const intro = nodes.filter((n) => !lists.includes(n));
  block.replaceChildren(el(
    'div',
    'za-container',
    el(
      'div',
      'za-row',
      el('div', 'za-col bl-guides-intro', ...intro),
      el('div', 'za-col bl-guides-list', ...lists),
    ),
  ));
}
