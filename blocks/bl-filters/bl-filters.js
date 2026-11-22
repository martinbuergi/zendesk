/**
 * bl-filters — listing filter controls, static (D3 interim: the listing is authored, so the
 * filters show the source's options without filtering).
 *
 * Authoring: one row per filter — <p>label</p> | <ul><li>option</li>…</ul>; a row with a label
 * only is an action (Clear all) or a field label (From / To); a heading row titles the panel.
 * Variants:
 *   bar    dropdown bar above a listing (customer stories): each label toggles its option panel
 *   aside  directory sidebar (marketplace): heading, keyword field (a one-item list = the field's
 *          placeholder), accordion groups (the first open), option counts as authored
 *   legacy gen-B type
 *
 * @ew-exempt <li> keyword-field placeholder (the single option of the first aside group) —
 *   rendered as the field's text, still authored + editable
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
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

let uid = 0;

function toggleable(label, panel, open) {
  uid += 1;
  const id = `bl-filters-panel-${uid}`;
  panel.id = id;
  label.setAttribute('role', 'button');
  label.tabIndex = 0;
  label.setAttribute('aria-controls', id);
  const set = (v) => {
    label.setAttribute('aria-expanded', String(v));
    panel.hidden = !v;
  };
  set(open);
  const flip = () => set(label.getAttribute('aria-expanded') !== 'true');
  label.addEventListener('click', flip);
  label.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });
}

export default function decorate(block) {
  const aside = block.classList.contains('aside');
  const parts = [];
  let groups = 0;
  [...block.children].forEach((row) => {
    const nodes = [];
    [...row.children].forEach((c) => nodes.push(...cellKids(c)));
    if (!nodes.length) return;
    const list = nodes.find((n) => n.matches('ul, ol'));
    const label = nodes.find((n) => n !== list);
    if (!list) {
      if (label && /^H[1-6]$/.test(label.tagName)) parts.push(el('div', 'bl-filters-title', label));
      else parts.push(el('div', 'bl-filters-action', ...nodes));
      return;
    }
    if (aside && list.children.length === 1 && groups === 0 && !/\(\d+\)\s*$/.test(list.textContent)) {
      // keyword field: label + the placeholder text in a field box
      parts.push(el('div', 'bl-filters-field', el('div', 'bl-filters-label', label), el('div', 'bl-filters-input', list)));
      return;
    }
    groups += 1;
    const panel = el('div', 'bl-filters-panel', list);
    const lab = el('div', 'bl-filters-label', label);
    toggleable(label, panel, aside && groups === 1);
    const group = el('div', 'bl-filters-group', lab, panel);
    // a directory's "Categories" group navigates (link list); the others are checkbox filters
    if (aside && /^categories$/i.test(label.textContent.trim())) group.classList.add('links');
    parts.push(group);
  });
  block.replaceChildren(el('div', aside ? 'bl-filters-aside' : 'za-container bl-filters-bar', ...parts));
}
