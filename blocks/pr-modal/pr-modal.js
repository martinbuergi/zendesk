/**
 * pr-modal — the pricing page's SSR modal content (feature explainers, add-on modals), hidden
 * at rest as on live, opened in a dialog by any link to #modal.<key> (feature list items,
 * "Compare all plan features"). Live motion: backdrop fade (lbWRkT) + dialog entrance
 * (inDLdD); Esc, the close button and a backdrop click close it.
 *
 * Authoring: one row per modal — cell 1: the modal key <p> (e.g. ticket-routing, matched by
 *   #modal.ticket-routing links); cell 2: the modal content (<h2>, <p>s, <ul>, <picture>).
 * Elements carrying data-modal-open="<key>" (pr-plans feature names) open it too.
 * Any other element carrying data-modal="<key>" (pr-matrix) or id="<key>" (sv-form modal)
 * is opened by the same handler. The modal content is MOVED into the dialog and back on close.
 * @ew-exempt <p> modal key (cell 1) — text-as-metadata, never displayed
 */

const CLOSE_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" d="M3 13L13 3m0 10L3 3"></path></svg>';

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

let state = null;

function closeModal() {
  if (!state) return;
  const {
    backdrop, src, mark, trigger,
  } = state;
  state = null;
  src.hidden = true;
  src.classList.remove('pr-modal-shown');
  mark.replaceWith(src);
  backdrop.remove();
  document.body.classList.remove('pr-modal-open');
  if (trigger && trigger.focus) trigger.focus();
}

function openModal(key, trigger) {
  const src = document.querySelector(`[data-modal="${CSS.escape(key)}"]`);
  if (!src) {
    const byId = document.getElementById(key);
    if (byId && byId.hidden) {
      byId.hidden = false;
      return true;
    }
    return false;
  }
  closeModal();
  const backdrop = el('div', 'pr-backdrop');
  const dialog = el('div', 'pr-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.tabIndex = -1;
  if (src.classList.contains('pr-matrix')) dialog.classList.add('pr-dialog-wide');
  const close = el('button', 'pr-dialog-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close modal');
  close.innerHTML = CLOSE_SVG;
  const body = el('div', 'pr-dialog-body');
  const mark = document.createComment(`pr-modal ${key}`);
  src.before(mark);
  body.append(src);
  src.hidden = false;
  src.classList.add('pr-modal-shown');
  const h = src.querySelector('h1, h2, h3');
  if (h) {
    h.id = h.id || `pr-dialog-title-${key}`;
    dialog.setAttribute('aria-labelledby', h.id);
  }
  dialog.append(close, body);
  backdrop.append(dialog);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  close.addEventListener('click', closeModal);
  document.body.append(backdrop);
  document.body.classList.add('pr-modal-open');
  state = {
    backdrop, src, mark, trigger,
  };
  dialog.focus();
  return true;
}

function bindOnce() {
  if (window.prModalBound) return;
  window.prModalBound = true;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  const fromTrigger = (e) => {
    const t = e.target.closest && e.target.closest('[data-modal-open]');
    if (t && openModal(t.dataset.modalOpen, t)) e.preventDefault();
    return !!t;
  };
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-modal-open]')) fromTrigger(e);
  });
  document.addEventListener('click', (e) => {
    if (fromTrigger(e)) return;
    const a = e.target.closest && e.target.closest('a[href*="#modal."]');
    if (!a) return;
    const href = a.getAttribute('href');
    const key = decodeURIComponent(href.slice(href.indexOf('#modal.') + 7));
    if (key && openModal(key, a)) e.preventDefault();
  });
}

export default function decorate(block) {
  bindOnce();
  if (block.querySelector(':scope > .pr-modal-item')) return;
  const items = [...block.children].map((row) => {
    const cells = [...row.children];
    const keyCell = cells[0];
    const key = keyCell ? keyCell.textContent.trim() : '';
    const item = el('div', 'pr-modal-item');
    if (key) item.dataset.modal = key;
    item.hidden = true;
    const keyWrap = el('div', 'pr-modal-key');
    if (keyCell) keyWrap.append(...keyCell.childNodes);
    const content = el('div', 'pr-modal-content');
    cells.slice(1).forEach((c) => content.append(...c.childNodes));
    item.append(keyWrap, content);
    return item;
  });
  block.replaceChildren(...items);
}
