/**
 * co-accordion — headed accordion section (live trust-center Accordion: head text 6/12 + optional
 * media 5/12, accordion below; items separated by hairlines, the first item open).
 *
 * Section head: default content before the block (<h2>, paragraphs, CTA <p>s, a picture <p>) is
 * reabsorbed into the head row; default content after the block is reabsorbed as the foot (EW8).
 * Authoring (rows, classified by shape):
 *   [<h3> title | panel prose]   starts an item (the second cell may be empty)
 *   [cell | cell …]              a row of the item's table (live 2-column data table: <h4> | text)
 *   [prose]                      1 cell: panel prose after the table
 * @variants class: lead (default none) — lead = the section that starts a tab group (no section
 *   padding; the gap above it is the row gap). Used with co-tabs, which adopts the sections.
 * @ew-exempt aria-label of the chevron toggle — runtime control, mirrors the authored title
 */

const CHEVRON = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 15.6 4.4 8l1.2-1.2 6.4 6.4 6.4-6.4L19.6 8z"/></svg>';

let seq = 0;

function el(tag, className, html) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html) n.innerHTML = html;
  return n;
}

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isCta = (n) => n.tagName === 'P' && !!n.querySelector('a[href]')
  && (n.classList.contains('button-wrapper') || !!n.querySelector('strong > a, em > a, a.button'));
const isHeading = (n) => /^H[1-6]$/.test(n.tagName);

function kids(cell) {
  if (!cell) return [];
  if (cell.children.length) return [...cell.children];
  if (!cell.textContent.trim()) return [];
  // HARNESS-ONLY fallback: wrap the cell's text nodes (never fires on DA content)
  const p = el('p');
  p.append(...cell.childNodes);
  return [p];
}

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'za-row co-acc-head');
  const txt = el('div', 'za-col co-acc-text');
  const body = el('div', 'za-text co-text');
  const links = el('div', 'co-links');
  let media = null;
  [...wrapper.children].forEach((n) => {
    if (!media && isMedia(n)) media = n;
    else if (isHeading(n)) txt.append(n);
    else if (isCta(n)) links.append(n);
    else body.append(n);
  });
  if (body.children.length) txt.append(body);
  if (links.children.length) txt.append(links);
  row.append(txt);
  if (media) {
    const col = el('div', 'za-col co-acc-media');
    col.append(media);
    row.append(col);
  }
  wrapper.remove();
  return row;
}

function buildFoot(block) {
  const wrapper = block.parentElement && block.parentElement.nextElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const foot = el('div', 'za-text co-acc-foot');
  foot.append(...wrapper.children);
  wrapper.remove();
  return foot;
}

function setOpen(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector('.co-acc-toggle').setAttribute('aria-expanded', String(open));
  item.querySelector('.co-acc-panel').hidden = !open;
}

function buildItem(titleCell, id) {
  const item = el('div', 'co-acc-item');
  const header = el('div', 'co-acc-header');
  const title = el('div', 'co-acc-title');
  title.append(...kids(titleCell));
  const toggle = el('button', 'co-acc-toggle', CHEVRON);
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', `${id}-panel`);
  toggle.setAttribute('aria-label', title.textContent.trim());
  header.append(title, toggle);
  const panel = el('div', 'co-acc-panel');
  panel.id = `${id}-panel`;
  panel.setAttribute('role', 'region');
  const inner = el('div', 'co-acc-inner');
  panel.append(inner);
  item.append(header, panel);
  header.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    setOpen(item, !item.classList.contains('is-open'));
  });
  return { item, inner };
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const foot = buildFoot(block);
  seq += 1;
  const list = el('div', 'co-acc-list');
  let cur = null;
  let table = null;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const first = kids(cells[0]);
    if (first.some((n) => n.tagName === 'H3') || (!cur && cells.length > 1)) {
      cur = buildItem(cells[0], `co-acc-${seq}-${list.children.length}`);
      cur.inner.append(...kids(cells[1]));
      list.append(cur.item);
      table = null;
    } else if (cur && cells.length > 1) {
      if (!table) {
        table = el('table', 'co-acc-table');
        table.append(el('tbody'));
        cur.inner.append(table);
      }
      const tr = el('tr');
      cells.forEach((c) => {
        const td = el('td');
        td.append(...kids(c));
        tr.append(td);
      });
      table.tBodies[0].append(tr);
    } else if (cur) {
      cur.inner.append(...first);
    }
  });
  [...list.children].forEach((item, i) => setOpen(item, i === 0));

  const col = el('div', 'za-col co-acc-col');
  if (head) col.append(head);
  col.append(list);
  if (foot) col.append(foot);
  const row = el('div', 'za-row');
  row.append(col);
  const container = el('div', 'za-container');
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
