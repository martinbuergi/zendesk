/**
 * zb-quotes — gen-B pull-quote pair (customer stories). Any number of quotes;
 * two per row from 768px.
 *
 * Authoring: one row per quote, cells
 *   1. the quote text            <p>“…”</p> (one or more paragraphs)
 *   2. attribution               <p>Name</p><p>Role at Company</p>
 *   3. optional stats under it   <p>69%</p><p>Less time spent …</p> (figure, text pairs)
 * A single-cell row is read as: last two paragraphs = name + role, the rest = quote.
 */

function div(className, ...children) {
  const d = document.createElement('div');
  d.className = className;
  d.append(...children.filter(Boolean));
  return d;
}

function kids(cell) {
  if (!cell) return [];
  const out = [...cell.children];
  // HARNESS-ONLY fallback: bare text in a cell (DA always wraps text in <p>)
  if (!out.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    out.push(p);
  }
  return out;
}

function buildQuote(row) {
  const cells = [...row.children];
  let quote = kids(cells[0]);
  let cite = kids(cells[1]);
  const stats = kids(cells[2]);
  if (cells.length === 1 && quote.length > 2) {
    cite = quote.slice(-2);
    quote = quote.slice(0, -2);
  }
  if (!quote.length && !cite.length) return null;

  const bq = document.createElement('blockquote');
  bq.append(...quote);
  const citeEl = document.createElement('cite');
  const [name, ...role] = cite;
  if (name) citeEl.append(div('zb-quotes-name', name));
  if (role.length) citeEl.append(div('zb-quotes-role', ...role));

  const statsEl = div('zb-quotes-stats');
  for (let i = 0; i < stats.length; i += 2) {
    statsEl.append(div(
      'zb-quotes-stat',
      div('zb-quotes-figure', stats[i]),
      stats[i + 1] ? div('zb-quotes-text', stats[i + 1]) : null,
    ));
  }
  return div('zb-quotes-col', div('zb-quotes-quote zb-quote', bq, citeEl, statsEl));
}

export default function decorate(block) {
  const cols = [...block.children].map(buildQuote).filter(Boolean);
  if (!cols.length) return;
  block.replaceChildren(div('zb-container', div('zb-row zb-quotes-row', ...cols)));
}
