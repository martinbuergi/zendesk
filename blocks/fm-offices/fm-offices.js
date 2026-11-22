/**
 * fm-offices — office directory (live contact "Our offices around the world": centred section
 * title over 4-up rows of address cells). Schema: stardust/eds-schema/contact.json section 2.
 * Authoring: the section title is default content before the block (reabsorbed into the
 * centred head); one row per office, one cell: the office heading (<h6>, optionally ending in
 * a MAP link) then address / link paragraphs (Shift+Enter line breaks kept).
 * A single cell holding every office works too (segmented on the office headings).
 */

const EXT = '<svg class="za-ext" xmlns="http://www.w3.org/2000/svg" width="12" height="12" focusable="false" viewBox="0 0 12 12" role="img" aria-label="(opens in a new tab)"><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>';
const PER_ROW = 4;

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);

/* office links: text in a span; web links open in a new tab with the hidden glyph */
function decorateLink(a) {
  if (a.querySelector(':scope > span')) return;
  const span = el('span');
  span.append(...a.childNodes);
  a.append(span);
  if (/^(https?:|\/)/.test(a.getAttribute('href') || '')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.insertAdjacentHTML('beforeend', EXT);
  }
}

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (cell.children.length) out.push(...cell.children);
    else if (cell.textContent.trim()) {
      // HARNESS-ONLY fallback: wrap the cell's bare text (never fires on DA content)
      const p = el('p');
      p.append(...cell.childNodes);
      out.push(p);
    }
  });
  return out;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const container = el('div', 'za-container fm-rel');

  // section head: default content before the block (EW8: move the wrapper's children)
  const headCol = el('div', 'za-col fm-head-col');
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (wrapper && wrapper.classList.contains('default-content-wrapper')) {
    headCol.append(...wrapper.childNodes);
    wrapper.remove();
  }

  // office cells: segment on the office heading (the most frequent heading tag)
  const nodes = collectNodes(block);
  const counts = {};
  nodes.filter(isHeading).forEach((h) => { counts[h.tagName] = (counts[h.tagName] || 0) + 1; });
  const unit = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const offices = [];
  let cur = null;
  nodes.forEach((n) => {
    if (unit && n.tagName !== unit && isHeading(n) && !offices.length) {
      headCol.append(n); // an in-table section title (fallback)
      return;
    }
    if (!cur || (unit && n.tagName === unit)) {
      cur = el('div', 'za-text fm-text');
      offices.push(cur);
    }
    n.querySelectorAll('a').forEach(decorateLink);
    cur.append(n);
  });

  if (headCol.childNodes.length) {
    const head = el('div', 'za-row fm-head');
    head.append(headCol);
    container.append(head);
  }
  const list = el('div', 'fm-list');
  for (let i = 0; i < offices.length; i += PER_ROW) {
    const row = el('div', 'za-row fm-orow');
    offices.slice(i, i + PER_ROW).forEach((o) => {
      const col = el('div', 'za-col fm-office');
      col.append(o);
      row.append(col);
    });
    list.append(row);
  }
  container.append(list);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
