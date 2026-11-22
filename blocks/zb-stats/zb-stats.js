/**
 * zb-stats — gen-B stats row (customer stories): big figure + caption, any count
 * (2 per row; 3 or more share the row from 768px).
 *
 * Authoring: one row per stat, cells  figure <p>69%</p> | caption <p>Less time …</p>
 * (a flattened single cell is read as figure, caption pairs).
 */

function div(className, ...children) {
  const d = document.createElement('div');
  d.className = className;
  d.append(...children.filter(Boolean));
  return d;
}

function kids(cell) {
  const out = [...cell.children];
  // HARNESS-ONLY fallback: bare text in a cell (DA always wraps text in <p>)
  if (!out.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    out.push(p);
  }
  return out;
}

export default function decorate(block) {
  const rows = [...block.children];
  let stats = rows.map((row) => [...row.children].map(kids))
    .filter((cells) => cells.flat().length)
    .map((cells) => (cells.length > 1
      ? { figure: cells[0], text: cells.slice(1).flat() }
      : { figure: cells[0].slice(0, 1), text: cells[0].slice(1) }));
  // flattened single cell holding several figure/caption pairs
  if (stats.length === 1 && stats[0].text.length > 1) {
    const flat = [...stats[0].figure, ...stats[0].text];
    stats = [];
    for (let i = 0; i < flat.length; i += 2) {
      stats.push({ figure: [flat[i]], text: flat[i + 1] ? [flat[i + 1]] : [] });
    }
  }
  if (!stats.length) return;
  const row = div('zb-row zb-stats-row', ...stats.map((s) => div(
    'zb-stats-col',
    div(
      'zb-stats-stat zb-stat',
      s.figure.length ? div('zb-stats-figure', ...s.figure) : null,
      s.text.length ? div('zb-stats-text', ...s.text) : null,
    ),
  )));
  block.classList.toggle('zb-stats-many', stats.length > 2);
  block.replaceChildren(div('zb-container', row));
}
