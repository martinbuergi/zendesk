/**
 * fm-form — form-template lead form (live Garden "contact-us-form": two-column field grid,
 * consent line, Send message). Dynamic disposition D2 (stardust/dynamic-features.md): UI +
 * client validation only — submit shows the loading state (300 ms, live .ymIyT), then the
 * required-field error skin + "This field is required"; a valid submit reports that no backend
 * is connected. Schema: stardust/eds-schema/contact.json section 1.
 *
 * Authoring (rows are classified by shape, not index):
 *   field row (2-4 cells): label <p> (+ optional hint <p> = tooltip) | type + flags | field name
 *     | options <ul> (select / tiles; a <strong> item is pre-selected)
 *   single-cell rows after the fields: consent <p>(s) (links open in a new tab) and the
 *     submit label = the last link-free <p>
 *   single-cell rows before the fields: optional form head (heading / intro), kept in order
 * Type cell vocabulary: type word text | email | tel | textarea | select | tiles (default text),
 *   then any of the flags required | half | hidden | suffix. Block variant `hidden`: the live
 *   page's display:none duplicate form. (Not declared as a variants tag: field names are one-word
 *   config cells outside any closed vocabulary.)
 * Sibling shapes (cluster-form-1):
 *   suffix flag — the 4th cell <p> is the in-field suffix (login ".zendesk.com")
 *   tiles options may start with an icon (:fm-consumer:) — shown in the tile, painted currentColor
 *   `note` row (copy | note [hidden]) — a note/consent paragraph kept in field order; hidden = a
 *     later step of the live multi-step form (interim D2: only the first step is shown)
 *   `progress` row (optional sr text "Step 1 of 6" | progress | n/m) — the step progress bar
 *   single-cell rows between fields stay in field order
 *   variants: login | modal | instapage | teaser (skins of the sibling pages)
 *   (cluster-form-2) halves — instapage half fields pair up; inline — submit beside the field;
 *   loose — webinar spacing (consent +6, submit +14 px)
 * @ew-exempt all — form: field labels, hints, types, names, options and the submit label are
 *   form configuration rendered into <label>/<option>/<button>; consent and head copy are moved
 */

const TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'tiles', 'note', 'progress'];
const AUTO = {
  FirstName: 'given-name',
  LastName: 'family-name',
  'account.name': 'organization',
  selectedCountry: 'country-name',
};
const EXT = '<svg class="za-ext" xmlns="http://www.w3.org/2000/svg" width="12" height="12" focusable="false" viewBox="0 0 12 12" role="img" aria-label="(opens in a new tab)"><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>';
const CHEVRON = '<svg class="fm-select-icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="m19.352 9.218-7.366 7.366-7.338-7.338L5.85 8.044l6.136 6.136 6.164-6.164z" clip-rule="evenodd"></path></svg>';
const CHECK = '<svg class="fm-tile-icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m5.788-14.384-6.944 8.888-4.55-4.529a1 1 0 0 1 1.412-1.417l2.95 2.938 5.556-7.112a1 1 0 1 1 1.576 1.232"></path></svg>';
const REQUIRED_MSG = 'This field is required';
const NO_BACKEND = 'Thanks! This preview has no form backend connected, so nothing was sent.';

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'f';

/* a link inside the form copy: underlined ct-link, its text in a span, new tab + hidden glyph */
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

/* :icon: spans (decorateIcons <img>) repainted as a currentColor mask so tiles can recolour them */
function maskIcon(span) {
  const name = [...span.classList].find((c) => c.startsWith('icon-'));
  const img = span.querySelector('img');
  const src = img ? img.getAttribute('src') : `${window.hlx?.codeBasePath || ''}/icons/${name ? name.slice(5) : ''}.svg`;
  span.classList.add('fm-icon');
  span.setAttribute('aria-hidden', 'true');
  span.style.maskImage = `url("${src}")`;
  span.style.webkitMaskImage = `url("${src}")`;
  span.replaceChildren();
  return span;
}

function labelText(p) {
  return p ? p.textContent.replace(/\s+/g, ' ').trim() : '';
}

function buildField(cells, base, hiddenForm) {
  const labelPs = [...cells[0].querySelectorAll('p')];
  const labelP = labelPs[0] || cells[0];
  const words = cells[1].textContent.trim().toLowerCase().split(/\s+/);
  const type = TYPES.includes(words[0]) ? words[0] : 'text';
  const flags = new Set(words.slice(1));
  const name = cells[2] ? cells[2].textContent.trim() : '';
  const opts = cells[3] ? [...cells[3].querySelectorAll('li')] : [];
  const id = `${base}-${slug(name || labelText(labelP))}`;
  const text = labelText(labelP);

  const field = el('div', `fm-field ${flags.has('half') ? 'fm-field-half' : 'fm-field-full'}`);
  if (flags.has('hidden')) field.hidden = true;
  const wrapper = el('div', 'fm-wrapper');
  let control;

  if (type === 'tiles') {
    const fs = el('fieldset', 'fm-fieldset');
    const legend = el('legend', 'fm-label');
    legend.textContent = text;
    const tiles = el('div', 'fm-tiles');
    tiles.setAttribute('role', 'radiogroup');
    opts.forEach((li) => {
      const v = li.textContent.trim();
      const tile = el('label', 'fm-tile');
      const icon = li.querySelector('span.icon');
      if (icon) {
        tile.classList.add('fm-tile-has-icon');
        tile.append(maskIcon(icon));
      }
      const t = el('span', 'fm-tile-label');
      t.title = v;
      t.textContent = v;
      const r = el('input', 'fm-sr');
      r.type = 'radio';
      r.name = name;
      r.value = v;
      if (li.querySelector('strong')) r.checked = true;
      tile.append(t);
      tile.insertAdjacentHTML('beforeend', CHECK);
      tile.append(r);
      tiles.append(tile);
    });
    wrapper.append(tiles);
    fs.append(legend, wrapper);
    field.append(fs);
    return field;
  }

  const label = el('label', 'fm-label');
  label.htmlFor = id;
  label.textContent = text;
  if (!hiddenForm) label.id = `${id}--label`;
  if (type === 'textarea') {
    control = el('textarea', 'fm-input fm-textarea');
  } else if (type === 'select') {
    control = el('select', 'fm-input fm-select-el');
    const ph = el('option');
    ph.value = '';
    ph.textContent = 'Select';
    control.append(ph);
    opts.forEach((li) => {
      const o = el('option');
      o.value = li.textContent.trim();
      o.textContent = o.value;
      if (li.querySelector('strong')) o.selected = true;
      control.append(o);
    });
  } else {
    control = el('input', 'fm-input');
    if (type !== 'text') control.type = type;
    control.value = '';
  }
  control.id = id;
  if (name) control.name = name;
  if (AUTO[name]) control.autocomplete = AUTO[name];
  if (type === 'email') control.setAttribute('aria-label', text);
  control.setAttribute('aria-invalid', 'false');
  if (flags.has('required') && !hiddenForm) control.required = true;

  if (type === 'select') {
    const sel = el('div', 'fm-select');
    sel.append(control);
    sel.insertAdjacentHTML('beforeend', CHEVRON);
    wrapper.append(sel);
  } else wrapper.append(control);
  if (flags.has('suffix') && cells[3]) {
    const sfx = el('p', 'fm-suffix');
    sfx.textContent = cells[3].textContent.trim();
    field.classList.add('fm-field-suffix');
    wrapper.append(sfx);
  }

  const hint = labelPs[1];
  if (hint) {
    // tooltip field (live Garden tooltip, hidden at rest): the hint paragraph moves into the box
    field.classList.add('fm-field-tip');
    const tipwrap = el('span', 'fm-tipwrap');
    tipwrap.tabIndex = hiddenForm ? -1 : 0;
    const tipId = `${id}-tip`;
    tipwrap.setAttribute('aria-describedby', tipId);
    const inner = el('span', 'fm-field-in');
    inner.append(label, wrapper);
    tipwrap.append(inner);
    const tip = el('div', 'fm-tip');
    tip.setAttribute('aria-hidden', 'true');
    const box = el('div', 'fm-tip-box');
    box.id = tipId;
    box.setAttribute('role', 'tooltip');
    box.append(hint);
    tip.append(box);
    field.append(tipwrap, tip);
  } else field.append(label, wrapper);
  return field;
}

function buildNote(nodes, hidden) {
  const f = el('div', 'fm-field fm-field-full fm-consent');
  if (hidden) f.hidden = true;
  nodes.forEach((n) => {
    n.querySelectorAll('a').forEach(decorateLink);
    f.append(n);
  });
  return f;
}

/* step progress (live .dVBJAQ track + fill); the "Step n of m" copy stays as screen-reader text */
function buildProgress(cells) {
  const [n, m] = cells[2].textContent.trim().split('/').map(Number);
  const wrap = el('div', 'fm-progress');
  const track = el('div', 'fm-progress-track');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', String(m || 1));
  track.setAttribute('aria-valuenow', String(n || 0));
  const fill = el('div', 'fm-progress-fill');
  fill.style.width = `${m ? (100 * n) / m : 0}%`;
  track.append(fill);
  wrap.append(track);
  const sr = cells[0].querySelector('p');
  if (sr) {
    sr.className = 'fm-sr';
    wrap.append(sr);
  }
  return wrap;
}

function setError(input, on) {
  const field = input.closest('.fm-field');
  const wrap = input.closest('.fm-wrapper');
  let msg = field.querySelector('.fm-msg');
  input.setAttribute('aria-invalid', on ? 'true' : 'false');
  if (on && !msg) {
    msg = el('div', 'fm-msg');
    msg.id = `${input.id}--message`;
    msg.textContent = REQUIRED_MSG;
    wrap.after(msg);
    input.setAttribute('aria-describedby', msg.id);
  } else if (!on && msg) {
    msg.remove();
    input.removeAttribute('aria-describedby');
  }
}

function wire(form) {
  const status = form.querySelector('.fm-status');
  const validate = () => {
    let first = null;
    form.querySelectorAll('[required]').forEach((f) => {
      const bad = !f.value.trim();
      setError(f, bad);
      if (bad && !first) first = f;
    });
    if (first) {
      status.hidden = true;
      first.focus();
      return;
    }
    status.textContent = NO_BACKEND;
    status.hidden = false;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // live: the form takes .ymIyT (opacity .6, pointer-events none) while it validates
    form.classList.add('is-loading');
    setTimeout(() => {
      form.classList.remove('is-loading');
      validate();
    }, 300);
  });
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.getAttribute('aria-invalid') === 'true' && t.value.trim()) setError(t, false);
  });
}

let uid = 0;

export default function decorate(block) {
  if (block.querySelector(':scope > form, :scope > div > form')) return;
  uid += 1;
  const hiddenForm = block.classList.contains('hidden');
  const first = !hiddenForm && !document.getElementById('contact-us-form');
  const base = first ? 'fm' : `fm${uid}`;

  const form = el('form', 'fm-form-el');
  form.noValidate = true;
  if (first) form.id = 'contact-us-form';
  const head = [];
  const grid = el('div', 'fm-grid');
  let foot = [];
  let fields = 0;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const kind = cells.length >= 2 ? cells[1].textContent.trim().toLowerCase().split(/\s+/) : [''];
    if (kind[0] === 'progress') {
      head.push(buildProgress(cells));
      return;
    }
    if (kind[0] === 'note') {
      foot.forEach((n) => grid.append(buildNote([n])));
      foot = [];
      grid.append(buildNote(cells[0].children.length ? [...cells[0].children] : [], kind.includes('hidden')));
      return;
    }
    if (kind[0]) {
      // single-cell rows between two fields keep their place in the field order
      foot.forEach((n) => grid.append(buildNote([n])));
      foot = [];
      grid.append(buildField(cells, base, hiddenForm));
      fields += 1;
      return;
    }
    const nodes = cells.flatMap((c) => (c.children.length ? [...c.children] : []));
    if (!fields) head.push(...nodes);
    else foot.push(...nodes);
  });

  const submitP = foot.filter((n) => n.tagName === 'P' && !n.querySelector('a')).pop();
  foot.forEach((n) => {
    if (n === submitP) return;
    grid.append(buildNote([n]));
  });
  head.forEach((n) => {
    n.querySelectorAll('span.icon').forEach(maskIcon);
    form.append(n);
  });
  form.append(grid);

  const actions = el('div', 'fm-actions');
  const btn = el('button', 'za-btn za-btn-primary fm-submit');
  btn.type = 'submit';
  const outer = el('span');
  const inner = el('span');
  inner.textContent = submitP ? submitP.textContent.trim() : 'Submit';
  outer.append(inner);
  btn.append(outer);
  actions.append(btn);
  const status = el('p', 'fm-status');
  status.setAttribute('role', 'status');
  status.hidden = true;
  form.append(actions, status);

  if (hiddenForm) {
    // live #contact-form-548: a second, display:none copy of the form
    block.hidden = true;
    block.setAttribute('aria-hidden', 'true');
    const holder = el('div');
    holder.append(form);
    block.replaceChildren(holder);
    return;
  }
  wire(form);
  block.replaceChildren(form);
}
