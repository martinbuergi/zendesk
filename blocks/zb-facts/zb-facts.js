/**
 * zb-facts — gen-B fact cards (customer stories): label + value, any count
 * (2 per row on mobile, 4 per row from 768px; variants three-up / two-up
 * size the columns to the count).
 *
 * Authoring: one row per fact, cells  label <h2> | value <p>
 * (a flattened single cell is segmented on each heading).
 */

function div(className, ...children) {
  const d = document.createElement('div');
  d.className = className;
  d.append(...children.filter(Boolean));
  return d;
}

export default function decorate(block) {
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) nodes.push(...kids);
    else if (cell.textContent.trim()) {
      // HARNESS-ONLY fallback: bare text in a cell (DA always wraps text in <p>)
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      nodes.push(p);
    }
  });
  const facts = [];
  let current = null;
  nodes.forEach((n) => {
    const isHead = /^H[1-6]$/.test(n.tagName);
    if (isHead || !current) {
      current = { label: null, value: [] };
      facts.push(current);
    }
    if (isHead) current.label = n;
    else current.value.push(n);
  });
  if (!facts.length) return;
  const row = div('zb-row zb-facts-row', ...facts.map((f) => div(
    'zb-facts-col',
    div(
      'zb-facts-fact zb-fact',
      f.label ? div('zb-facts-label', f.label) : null,
      f.value.length ? div('zb-facts-value', ...f.value) : null,
    ),
  )));
  block.replaceChildren(div('zb-container', row));
}
