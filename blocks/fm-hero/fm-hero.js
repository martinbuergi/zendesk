/**
 * fm-hero — form-template lead section (contact): eyebrow over a 6/1/5 row — heading, intro
 * and the section's fm-form block(s) on the left, contact cards on the right.
 * Schema: stardust/eds-schema/contact.json section 1.
 * Authoring (content is classified, not indexed):
 *   lead row, one cell: eyebrow <p> (before the heading), <h1>, intro <p>(s)
 *   one row per contact card: <h3>, copy <p>(s), an optional link-only <p> (arrow link)
 *   the lead form is its own fm-form block placed after this one in the same section; the
 *   hero adopts every fm-form of its section into the left column, in order.
 * Sibling shapes (cluster-form-1): the first row is always the lead (its heading may be any level;
 *   a link-only <p> holding an :icon: is the page logo); a row holding only an image is the
 *   backdrop; a side link authored as a button (<em>/<strong> link) stays a button.
 * Variants: center (login: one centred column, side links under a rule, matcha corner glow) |
 *   modal (the live open-on-load lead dialog over the page) | backdrop (with modal: full-viewport
 *   image behind the dialog from 768 px; below, a plain tinted page with logo and side links) |
 *   instapage (the bare embedded-form pages: no section chrome, 5 px page inset)
 */

const EXT = '<svg class="za-ext" xmlns="http://www.w3.org/2000/svg" width="12" height="12" focusable="false" viewBox="0 0 12 12" role="img" aria-label="(opens in a new tab)"><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>';
const ARROW = '<span class="fm-arrow"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg></span>';

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const linkOnly = (n) => n.tagName === 'P' && n.querySelector('a[href]')
  && n.textContent.trim() === n.querySelector('a[href]').textContent.trim();
const isExternal = (a) => {
  try {
    const u = new URL(a.getAttribute('href'), window.location.href);
    return /^https?:$/.test(u.protocol) && u.origin !== window.location.origin
      && u.hostname !== 'www.zendesk.com';
  } catch (e) {
    return false;
  }
};

/* :icon: spans (decorateIcons <img>) in copy repainted as a currentColor mask */
function maskIcon(span) {
  const name = [...span.classList].find((c) => c.startsWith('icon-'));
  const img = span.querySelector('img');
  const src = img ? img.getAttribute('src') : `${window.hlx?.codeBasePath || ''}/icons/${name ? name.slice(5) : ''}.svg`;
  span.classList.add('fm-icon');
  span.setAttribute('aria-hidden', 'true');
  span.style.maskImage = `url("${src}")`;
  span.style.webkitMaskImage = `url("${src}")`;
  span.replaceChildren();
}

const isButtonP = (n) => n.tagName === 'P' && n.querySelector('a.button');
const isLogoP = (n) => linkOnly(n) || (n.tagName === 'P' && n.children.length === 1
  && n.firstElementChild.tagName === 'A' && n.querySelector('a span.icon'));
const isMediaRow = (nodes) => nodes.length === 1 && nodes[0].querySelector('picture, img')
  && !nodes[0].textContent.trim();

function cellNodes(cell) {
  if (cell.children.length) return [...cell.children];
  if (!cell.textContent.trim()) return [];
  // HARNESS-ONLY fallback: wrap the cell's bare text (never fires on DA content)
  const p = el('p');
  p.append(...cell.childNodes);
  return [p];
}

/* arrow link (.lcYUJf LinkRoot + .cvVZfl arrow): text span, arrow glyph, hidden new-tab glyph */
function arrowLink(a) {
  if (a.querySelector('.fm-arrowlink-t')) return;
  const t = el('span', 'fm-arrowlink-t');
  t.append(...a.childNodes);
  a.append(t);
  a.insertAdjacentHTML('beforeend', ARROW);
  if (isExternal(a)) {
    a.rel = 'noopener noreferrer';
    a.insertAdjacentHTML('beforeend', EXT);
  }
}

function inlineLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    if (a.querySelector(':scope > span')) return;
    const s = el('span');
    s.append(...a.childNodes);
    a.append(s);
  });
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const section = block.closest('.section');
  const rows = [...block.children];

  const eyebrow = el('div', 'za-eyebrow fm-eyebrow');
  const main = el('div', 'za-col fm-col-6');
  const intro = el('div', 'za-text fm-text');
  const side = el('div', 'za-col fm-col-5');
  let logo = null;
  let backdrop = null;
  let lead = true;

  rows.forEach((row, i) => {
    const nodes = [...row.children].flatMap(cellNodes);
    const h = nodes.find(isHeading);
    if (i > 0 && isMediaRow(nodes)) {
      backdrop = el('div', 'fm-backdrop');
      backdrop.append(nodes[0].querySelector('picture') || nodes[0].querySelector('img'));
      return;
    }
    if (lead && (i === 0 || !h || h.tagName === 'H1' || h.tagName === 'H2')) {
      let seen = false;
      nodes.forEach((n) => {
        if (n.querySelector('a span.icon') && isLogoP(n)) {
          logo = n;
          logo.className = 'fm-logo';
          // authored link text = the logo's accessible name (live aria-label); the icon paints
          const a = n.querySelector('a');
          a.setAttribute('aria-label', a.textContent.trim() || 'Zendesk');
          [...a.childNodes].filter((c) => c.nodeType === Node.TEXT_NODE)
            .forEach((c) => c.remove());
        } else if (isHeading(n)) {
          seen = true;
          main.append(n);
        } else if (!seen && n.tagName === 'P' && h) eyebrow.append(n);
        else {
          n.querySelectorAll('span.icon').forEach(maskIcon);
          intro.append(n);
        }
      });
      if (h || i === 0) lead = false;
      return;
    }
    lead = false;
    // contact card
    const card = el('div', 'za-row fm-siderow');
    const col = el('div', 'za-col');
    const text = el('div', 'za-text fm-text');
    nodes.forEach((n) => {
      if (isHeading(n)) col.append(n);
      else if (isButtonP(n)) {
        if (text.children.length) col.append(text);
        n.classList.add('fm-cta-button');
        col.append(n);
      } else if (linkOnly(n) && !block.classList.contains('center')) {
        if (text.children.length) col.append(text);
        n.classList.add('fm-cta');
        arrowLink(n.querySelector('a[href]'));
        col.append(n);
      } else text.append(n);
    });
    if (text.children.length && !text.parentElement) col.append(text);
    inlineLinks(text);
    card.append(col);
    side.append(card);
  });
  if (intro.children.length) {
    inlineLinks(intro);
    main.append(intro);
  }

  // adopt the section's lead form block(s) into the left column (EW9: decorated blocks move whole)
  if (section) {
    section.querySelectorAll(':scope > .fm-form-wrapper').forEach((w) => main.append(w));
  }

  const container = el('div', 'za-container fm-rel');
  if (block.classList.contains('modal')) {
    // live open-on-load lead dialog (role=dialog, no close control on the source)
    const h1 = main.querySelector('h1');
    if (h1 && !h1.id) h1.id = 'fm-dialog-title';
    const dialog = el('div', 'fm-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    if (h1) dialog.setAttribute('aria-labelledby', h1.id);
    main.className = 'fm-dialog-body';
    dialog.append(main);
    if (logo) container.append(logo);
    container.append(dialog);
    if (side.children.length) container.append(side);
    block.replaceChildren(...(backdrop ? [backdrop] : []), container);
    return;
  }
  const row = el('div', 'za-row fm-row');
  row.append(main, el('div', 'za-col fm-col-1'), side);
  if (logo) container.append(logo);
  if (eyebrow.children.length) container.append(eyebrow);
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(...(backdrop ? [backdrop] : []), container);
}
