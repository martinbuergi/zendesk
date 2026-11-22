/**
 * pr-matrix — the "Compare all plan features" comparison table (live pricing-table modal,
 * served hidden in the page). Hidden at rest; opened in the pr-modal dialog by any link to
 * #modal.pricing-table. "Show differences only" hides the rows whose plan values are equal.
 *
 * Authoring:
 *   first row: cell 1 = the toggle label <p>; one cell per plan = plan name <p> + Buy now <p>;
 *   category row (one cell, a heading): <h3> group title — opens a group of rows;
 *   feature row: cell 1 = feature name <p> + description <p> (or an <h6> for the price rows);
 *     one cell per plan = the value <p> (:pr-check: renders the included tick).
 * @ew-exempt <input> "Show differences only" checkbox — runtime control for the authored label
 */

const KEY = 'pricing-table';

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);

function cellValue(cell) {
  const icon = cell.querySelector('.icon');
  if (icon) return [...icon.classList].join(' ');
  return cell.textContent.trim();
}

export default function decorate(block) {
  block.dataset.modal = KEY;
  block.hidden = true;
  if (block.querySelector(':scope > table')) return;
  const rows = [...block.children];
  const table = el('table', 'pr-matrix-table');
  const thead = el('thead');
  const tbody = el('tbody');
  rows.forEach((row, r) => {
    const cells = [...row.children];
    const tr = el('tr');
    if (r === 0) {
      cells.forEach((c, i) => {
        const cellEl = el(i === 0 ? 'th' : 'td', i === 0 ? 'pr-matrix-toggle' : 'pr-matrix-plan');
        if (i === 0) {
          const id = `pr-matrix-diff-${Math.random().toString(36).slice(2, 8)}`;
          const box = el('input');
          box.type = 'checkbox';
          box.id = id;
          box.name = 'show-diffence-toggle';
          const label = el('label');
          label.htmlFor = id;
          label.append(...c.childNodes);
          box.addEventListener('change', () => table.classList.toggle('pr-matrix-diff', box.checked));
          cellEl.append(box, label);
        } else cellEl.append(...c.childNodes);
        tr.append(cellEl);
      });
      thead.append(tr);
      return;
    }
    const kids = cells.flatMap((c) => [...c.children]);
    if (cells.length === 1 && kids.some(isHeading)) {
      tr.className = 'pr-matrix-cat';
      const th = el('th');
      th.colSpan = Math.max(2, rows[0].children.length);
      th.append(...cells[0].childNodes);
      tr.append(th);
      tbody.append(tr);
      return;
    }
    cells.forEach((c, i) => {
      const cellEl = el(i === 0 ? 'th' : 'td');
      cellEl.append(...c.childNodes);
      tr.append(cellEl);
    });
    const values = [...tr.querySelectorAll(':scope > td')].map(cellValue);
    if (values.length && values.every((v) => v === values[0])) tr.classList.add('pr-matrix-same');
    tbody.append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(table);
}
