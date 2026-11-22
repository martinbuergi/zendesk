/**
 * sv-links — icon link grid (live .jxjGLI + .fPdbCw "Explore capabilities"): each card
 * is one link with an icon, a title and a one-line description; 3 columns >= 768.
 * Schema: stardust/eds-schema/service.json section 5 (#teaser-f414d9e21d).
 *
 * Section head: default content before the block (<h2>, optional eyebrow/lede) is
 * reabsorbed into a left-aligned head row (EW8).
 * Authoring: one row per link — cell 1: an icon token (:sv-ai-agents:) or a small
 *   <picture>; cell 2: ONE link paragraph whose leading <strong> is the title and the
 *   rest the description: <p><a href="…"><strong>AI agents</strong> Automate …</a></p>.
 *   The authored anchor is the card (icon moved in; text untouched).
 * Variant `subnav` (landing / microsite header bar, live sticky page header; the page carries
 *   Metadata nav | /nav-none so no global header renders): one row, three cells —
 *   [brand: logo link <p>s (an <img>, or a :za-logo: token) | nav <ul> of links (optional) |
 *   CTA <p>s (<strong> link = primary, <em> link = secondary)]. Authored nodes are moved into
 *   the bar; a menu toggle (no authored text) opens the nav + CTAs below the desktop width.
 *   Without a nav list (`.no-nav`, live /web-widget/) the primary CTA stays in the bar at
 *   every width.
 *   `subnav blog` (gen B blog-family sub-bar under the global header, live /repeatcustomer/): a
 *   text brand link + section links, shown at >= 1150 only (live mobile swaps it for the header).
 * @ew-exempt icon token (cell 1) — glyph key, never displayed as text
 */

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

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'za-row');
  const col = el('div', 'za-col sv-links-head');
  const kids = [...wrapper.children];
  let hIdx = kids.findIndex((n) => /^H[1-6]$/.test(n.tagName));
  // two leading headings (legacy pages): the first is the eyebrow, the second the title
  if (hIdx === 0 && kids[1] && /^H[1-6]$/.test(kids[1].tagName)) hIdx = 1;
  kids.forEach((n, i) => {
    if (i === hIdx) col.append(n);
    else if (hIdx >= 0 && i < hIdx) col.append(wrapNode(n, 'za-eyebrow'));
    else col.append(wrapNode(n, 'za-text sv-lead'));
  });
  wrapper.remove();
  row.append(col);
  return row;
}

const TOKEN = /^:([a-z0-9-]+):$/i;

function iconOf(nodes) {
  const n = nodes.find((x) => x.querySelector('span.icon, picture, img') && !x.textContent.trim());
  if (n) return n;
  // HARNESS-ONLY fallback: the delivery pipeline turns :name: into span.icon server-side
  const t = nodes.find((x) => x.tagName === 'P' && TOKEN.test(x.textContent.trim()));
  if (!t) return null;
  const name = TOKEN.exec(t.textContent.trim())[1];
  const span = el('span', `icon icon-${name}`);
  const img = el('img');
  img.src = `${window.hlx ? window.hlx.codeBasePath : ''}/icons/${name}.svg`;
  img.alt = '';
  span.append(img);
  return span;
}

const MENU = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 9h20M6 16h20M6 23h20"></path></svg>';

function decorateSubnav(block) {
  const first = block.firstElementChild;
  const [brandCell, navCell, ctaCell] = first ? [...first.children] : [];
  const bar = el('div', 'sv-subnav-bar');
  const brand = el('div', 'sv-subnav-brand');
  if (brandCell) brand.append(...brandCell.children);
  brand.querySelectorAll('a').forEach((a, i) => {
    a.classList.add(i === 0 ? 'sv-subnav-logo' : 'sv-subnav-logo-alt');
    if (!a.getAttribute('aria-label') && !a.textContent.trim()) a.setAttribute('aria-label', a.title || 'Home');
  });
  const menu = el('div', 'sv-subnav-menu');
  menu.id = `sv-subnav-menu-${Math.random().toString(36).slice(2, 8)}`;
  const list = navCell && navCell.querySelector('ul');
  if (list) {
    list.classList.add('sv-subnav-list');
    menu.append(list);
  } else block.classList.add('no-nav');
  const ctas = el('div', 'sv-subnav-ctas');
  if (ctaCell) ctas.append(...ctaCell.children);
  menu.append(ctas);
  const toggle = el('button', 'sv-subnav-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', menu.id);
  toggle.innerHTML = MENU;
  toggle.addEventListener('click', () => {
    const open = !block.classList.contains('is-open');
    block.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  bar.append(brand, menu, toggle);
  block.replaceChildren(bar);
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container, :scope > .sv-subnav-bar')) return;
  if (block.classList.contains('subnav')) {
    decorateSubnav(block);
    return;
  }
  const head = buildHead(block);
  const caps = el('div', 'sv-caps');
  [...block.children].forEach((r) => {
    const nodes = [...r.children].flatMap((c) => [...c.children]);
    const linkP = nodes.find((n) => n.querySelector('a[href]') && n.textContent.trim());
    if (!linkP) return;
    const link = linkP.querySelector('a[href]');
    if (link.title === link.textContent) link.removeAttribute('title');
    const card = wrapNode(linkP, 'sv-cap');
    // inside the authored anchor (text unchanged): icon, title (leading <strong>), description
    const icon = el('span', 'sv-cap-icon');
    const ic = iconOf(nodes.filter((n) => n !== linkP));
    if (ic) icon.append(ic);
    const content = el('span', 'sv-cap-content');
    const first = link.firstElementChild;
    const before = first ? [...link.childNodes].slice(0, [...link.childNodes].indexOf(first)) : [];
    const lead = first && /^(STRONG|B)$/.test(first.tagName)
      && !before.some((n) => n.textContent.trim()) ? first : null;
    const kids = [...link.childNodes];
    if (lead) {
      const title = el('span', 'sv-cap-title');
      title.append(lead);
      const sub = el('span', 'sv-cap-sub');
      kids.filter((k) => k !== lead).forEach((k) => sub.append(k));
      content.append(title);
      if (sub.textContent.trim()) content.append(sub);
    } else {
      const title = el('span', 'sv-cap-title');
      title.append(...kids);
      content.append(title);
    }
    link.append(icon, content);
    // a description authored as its own paragraph stays beside the link (fallback shape)
    nodes.forEach((n) => {
      if (n === linkP || n === ic || n.contains(ic) || TOKEN.test(n.textContent.trim())) return;
      if (n.tagName === 'P' && n.textContent.trim()) card.append(wrapNode(n, 'sv-cap-more'));
    });
    caps.append(card);
  });
  const row = el('div', 'za-row');
  const col = el('div', 'za-col');
  col.append(caps);
  row.append(col);
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
