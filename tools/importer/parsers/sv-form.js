/* eslint-disable */
/* global WebImporter */

/**
 * sv-form parser (template service-2).
 * Source: #main-content > div > div:has(> div.sc-d0574c0f-1 > form) (hidden Contact Sales dialog).
 *
 * Output (matches blocks/sv-form/sv-form.js and content/service.plain.html):
 *   'sv-form (modal)' — default dialog id contact-sales (no modal-<name> class), so the
 *   page's contact links keep their authored hrefs, exactly as on /service.
 *   row 1 (one cell):  <h3> title, intro <p>(s)
 *   one row per field:  label <p> (+ hint <p>) | type | field name | <ul> options (select)
 *   last row (one cell): privacy <p> (with link), submit label <p>
 */
const TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox'];
// label -> field name used on /service, for DOMs that lost the name attribute
const NAMES = {
  'work email': 'owner.email',
  message: 'question',
  'first name': 'FirstName',
  'last name': 'LastName',
  'company name': 'account.name',
  'number of employees': 'account.help_desk_size',
  'phone number': 'address.phone',
  country: 'selectedCountry',
};

const txt = (n) => (n ? n.textContent.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim() : '');

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function cleanP(src, document) {
  const clone = src.cloneNode(true);
  clone.querySelectorAll('svg, img').forEach((s) => s.remove());
  clone.querySelectorAll('a').forEach((a) => {
    const n = document.createElement('a');
    n.href = a.getAttribute('href') || '';
    n.textContent = a.textContent.trim();
    a.replaceWith(n);
  });
  const p = document.createElement('p');
  p.innerHTML = clone.innerHTML.replace(/\s+/g, ' ').trim().replace(/<\/a>\s+([.,;:!?])/g, '</a>$1');
  return p;
}

function fieldType(control, label) {
  if (control.tagName === 'TEXTAREA') return 'textarea';
  if (control.tagName === 'SELECT') return 'select';
  const t = (control.getAttribute('type') || '').toLowerCase();
  if (TYPES.includes(t)) return t;
  if (/e-?mail/i.test(label)) return 'email';
  if (/phone/i.test(label)) return 'tel';
  return 'text';
}

export default function parse(element, { document }) {
  const form = element.querySelector('form') || element;
  const cells = [];

  // head: title + intro
  const head = [];
  const title = form.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4') || form.querySelector('h3');
  if (txt(title)) {
    const h = document.createElement('h3');
    h.textContent = txt(title);
    head.push(h);
  }
  form.querySelectorAll(':scope > [class*="Textstyle__TextRoot"] > p, :scope > [class*="Textstyle__TextRoot"]:is(p)').forEach((p) => {
    if (txt(p)) head.push(cleanP(p, document));
  });
  if (head.length) cells.push([head]);

  // fields
  const roots = [...form.querySelectorAll('[class*="FormFieldstyle__FormFieldRoot"]')];
  roots.forEach((root) => {
    const control = root.querySelector('input, textarea, select');
    if (!control) return;
    const labelText = txt(root.querySelector('label')) || control.getAttribute('aria-label') || control.getAttribute('label') || '';
    const labelCell = [para(document, labelText)];
    // tooltip hint attached to the field (e.g. Work email)
    const wrap = root.closest('.sc-9709aa77-5') || root.parentElement.closest('[class*="sc-9709aa77-5"]');
    const tip = wrap && wrap.querySelector('[class*="Tooltipstyle__TooltipRoot"], [role="tooltip"]');
    if (txt(tip)) labelCell.push(para(document, txt(tip)));

    const type = fieldType(control, labelText);
    const name = control.getAttribute('name') || NAMES[labelText.toLowerCase()] || '';
    let options = '';
    if (control.tagName === 'SELECT') {
      const ul = document.createElement('ul');
      [...control.querySelectorAll('option')].forEach((o, i) => {
        const v = txt(o);
        if (!v || (i === 0 && /^select$/i.test(v))) return;
        const li = document.createElement('li');
        li.textContent = v;
        ul.append(li);
      });
      if (ul.children.length) options = [ul];
    }
    cells.push([labelCell, type, name, options]);
  });

  // foot: privacy notice + submit label
  const foot = [];
  const privacy = [...form.querySelectorAll('p')].filter((p) => p.querySelector('a') && !p.closest('[class*="FormFieldstyle__FormFieldRoot"]')).pop();
  if (privacy) foot.push(cleanP(privacy, document));
  const submit = form.querySelector('button[type="submit"], [class*="LinkGroupstyle"] button, button');
  foot.push(para(document, txt(submit) || 'Submit'));
  cells.push([foot]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'sv-form (modal)', cells });
  element.replaceWith(block);
}
