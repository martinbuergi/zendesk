/**
 * sv-form — lead form (live "Contact Sales" formpreset): title, intro, a two-column
 * field grid, privacy notice and submit. Variant `modal`: a hidden dialog (as on live,
 * where nothing opens it at rest) that links to #contact-sales open.
 * Dynamic disposition D2 (stardust/dynamic-features.md): UI + client validation only;
 * submit captures locally and reports that no backend is connected.
 *
 * Authoring:
 *   first row(s), one cell: title heading, intro <p>(s)
 *   one row per field: label <p> (+ optional hint <p>) | type word | field name
 *     | options <ul> (select only)
 *   last row(s), one cell: privacy <p> (with its link) and the submit label <p>
 *
 * Field types (cell 2): text | email | tel | textarea | select | checkbox (default text).
 * Block variant: modal; a `modal-<name>` variant class names the dialog (id <name>, opened by
 * links to #<name> or #modal.<name>, as on live /cxtrends/); default id contact-sales.
 * @ew-exempt all — form: field labels, types, names and options are form configuration
 */

const TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox'];
const EXT = '<svg class="sv-ext" role="img" aria-label="(opens in a new tab)" focusable="false" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>';

let uid = 0;

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function wrapNode(node, className) {
  const w = el('div', className);
  w.append(node);
  return w;
}

const AUTO = {
  FirstName: 'given-name', LastName: 'family-name', 'account.name': 'organization', 'address.phone': 'tel', 'owner.email': 'email',
};

function buildField(row, base, i) {
  const cells = [...row.children];
  const labelPs = [...cells[0].children];
  const type = (cells[1].textContent.trim().toLowerCase() || 'text');
  const kind = TYPES.includes(type) ? type : 'text';
  const name = cells[2] ? cells[2].textContent.trim() : '';
  const field = el('div', 'sv-field');
  const id = `${base}-f${i}`;
  const label = el('label', 'sv-field-label');
  label.htmlFor = id;
  if (labelPs[0]) label.append(...labelPs[0].childNodes);
  field.append(label);
  let input;
  if (kind === 'textarea') input = el('textarea', 'sv-input');
  else if (kind === 'select') {
    input = el('select', 'sv-input');
    const ph = el('option');
    ph.value = '';
    ph.textContent = 'Select';
    ph.selected = true;
    input.append(ph);
    (cells[3] ? [...cells[3].querySelectorAll('li')] : []).forEach((li) => {
      const o = el('option');
      o.value = li.textContent.trim();
      o.textContent = li.textContent.trim();
      input.append(o);
    });
  } else if (kind === 'checkbox') {
    input = el('input', 'sv-check');
    input.type = 'checkbox';
    field.classList.add('sv-field-check');
  } else {
    input = el('input', 'sv-input');
    input.type = kind;
  }
  input.id = id;
  if (name) input.name = name;
  if (AUTO[name]) input.autocomplete = AUTO[name];
  if (kind === 'email') input.required = true;
  field.append(input);
  if (labelPs[1]) {
    const tip = wrapNode(labelPs[1], 'sv-tip');
    tip.id = `${id}-tip`;
    tip.setAttribute('role', 'tooltip');
    input.setAttribute('aria-describedby', tip.id);
    field.append(tip);
  }
  return field;
}

export default function decorate(block) {
  if (block.querySelector(':scope > form')) return;
  uid += 1;
  const base = `sv-form-${uid}`;
  const modal = block.classList.contains('modal');
  const form = el('form', 'sv-modal-form');
  form.noValidate = true;
  form.action = '#';
  const grid = el('div', 'sv-modal-grid');
  const headNodes = [];
  const footNodes = [];
  let fieldIdx = 0;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      grid.append(buildField(row, base, fieldIdx));
      fieldIdx += 1;
    } else if (fieldIdx === 0) headNodes.push(...cells.flatMap((c) => [...c.children]));
    else footNodes.push(...cells.flatMap((c) => [...c.children]));
  });
  headNodes.forEach((n) => {
    if (/^H[1-6]$/.test(n.tagName)) {
      n.id = n.id || `${base}-title`;
      form.append(n);
    } else form.append(wrapNode(n, 'za-text'));
  });
  form.append(grid);
  const submitP = footNodes.filter((n) => !n.querySelector('a')).pop();
  footNodes.forEach((n) => {
    if (n === submitP) return;
    n.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      if (a.title === a.textContent) a.removeAttribute('title');
      if (!a.querySelector('.sv-ext')) a.insertAdjacentHTML('beforeend', EXT);
    });
    form.append(wrapNode(n, 'sv-small'));
  });
  const btn = el('button', 'za-btn za-btn-primary');
  btn.type = 'submit';
  const span = el('span');
  span.textContent = submitP ? submitP.textContent.trim() : 'Submit';
  btn.append(span);
  form.append(btn);
  const status = el('p', 'sv-form-status');
  status.setAttribute('role', 'status');
  form.append(status);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = [...form.elements].find((f) => f.willValidate && !f.checkValidity());
    if (bad) {
      bad.reportValidity();
      return;
    }
    status.textContent = 'Thank you. No form backend is connected yet, so nothing was sent.';
  });

  block.replaceChildren(form);
  if (modal) {
    const title = form.querySelector('h1, h2, h3, h4');
    const named = [...block.classList].find((c) => c.startsWith('modal-'));
    block.id = block.id || (named ? named.slice(6) : 'contact-sales');
    block.setAttribute('role', 'dialog');
    block.setAttribute('aria-modal', 'true');
    if (title) block.setAttribute('aria-labelledby', title.id);
    block.hidden = true;
    const close = () => { block.hidden = true; };
    block.addEventListener('click', (e) => { if (e.target === block) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !block.hidden) close(); });
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest(`a[href$="#${block.id}"], a[href$="#modal.${block.id}"]`);
      if (!a) return;
      e.preventDefault();
      block.hidden = false;
      const first = form.querySelector('input, select, textarea');
      if (first) first.focus();
    });
  }
}
