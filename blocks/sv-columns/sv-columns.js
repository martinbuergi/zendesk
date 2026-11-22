/**
 * sv-columns — cream rounded card with equal columns (live .fAEpuK "Protected by Zendesk"):
 * a lead column (heading) and N text columns (title, text, text link).
 * Schema: stardust/eds-schema/service.json section 7 (#teaser-8596b9dd03).
 *
 * Authoring: one row, one cell per column. Lead cell: <h2>. Other cells: <h3>, body <p>(s),
 *   link <p><a> (plain link = animated text link; <strong>/<em> link = button).
 *
 * Variants (program siblings):
 *   media | text  split section: row 1 [text | media]; the text cell carries eyebrow <p>
 *                 (before the heading), heading, body, list, CTA <p>s; the media cell a
 *                 <picture> (or an .mp4 link → muted looping video). A one-cell row 1 is a
 *                 centered head. Further rows: one grid of columns (picture, title, text).
 *                 `reverse`: media first at >= 768.
 *   tabs          one row per tab: [label <p> | panel content]; the first tab is open.
 *   event         (with text) event countdown card: row 1 [text + CTAs | picture], row 2 one
 *                 cell per countdown unit (static capture text); the label paragraph right
 *                 before the CTAs is the kind eyebrow ("Digital Event").
 *   modal         a hidden dialog (live cxtrends trend details, `display: none` until a
 *                 `#modal.<name>` link opens it); the name rides as a `modal-<name>` variant
 *                 class and becomes the block id. A close control (no authored text) is added.
 * @variants block: media, text, tabs, reverse, grid, legacy, modal, event (default none)
 */

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

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isCta = (n) => n.tagName === 'P' && !!n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();
const isMp4 = (n) => n.tagName === 'P' && !!n.querySelector('a[href$=".mp4"], a[href*="/is/content/"]');

function mp4Video(p) {
  const a = p.querySelector('a');
  const v = document.createElement('video');
  v.src = a.href;
  v.muted = true;
  v.loop = true;
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('aria-label', a.textContent.trim());
  const w = el('div', 'sv-split-video');
  a.replaceWith(v);
  w.append(p);
  return w;
}

// text column: eyebrow(s) before the first heading, heading, body, CTAs
function textCol(nodes) {
  const col = el('div', 'za-col sv-split-text');
  let hIdx = nodes.findIndex(isHeading);
  // two leading headings (legacy pages): the first is the eyebrow, the second the title
  if (hIdx === 0 && nodes[1] && isHeading(nodes[1])) hIdx = 1;
  const ctas = el('div', 'sv-split-ctas');
  nodes.forEach((n, i) => {
    if (hIdx > 0 && i < hIdx) col.append(wrapNode(n, 'za-eyebrow'));
    else if (isHeading(n)) col.append(n);
    else if (isCta(n)) {
      n.querySelectorAll('a').forEach((a) => { if (a.title === a.textContent) a.removeAttribute('title'); });
      ctas.append(n);
    } else col.append(wrapNode(n, 'za-text'));
  });
  if (ctas.children.length) col.append(ctas);
  return col;
}

function mediaCol(nodes) {
  const col = el('div', 'za-col sv-split-media');
  nodes.forEach((n) => col.append(isMp4(n) ? mp4Video(n) : wrapNode(n, 'sv-split-img')));
  return col;
}

function decorateSplit(block) {
  const rows = [...block.children];
  const container = el('div', 'za-container za-row-gap');
  rows.forEach((r, ri) => {
    const cells = [...r.children];
    if (ri === 0) {
      const row = el('div', 'za-row sv-split');
      if (cells.length === 1) {
        row.classList.add('sv-split-head');
        row.append(textCol([...cells[0].children]));
      } else {
        const [a, b] = cells;
        const bNodes = [...b.children];
        const media = bNodes.length && bNodes.every((n) => isMedia(n) || isMp4(n));
        row.append(textCol([...a.children]));
        if (media) row.append(mediaCol(bNodes));
        else {
          const aside = textCol(bNodes);
          aside.classList.add('sv-split-aside');
          row.append(aside);
        }
      }
      container.append(row);
    } else {
      const grid = el('div', 'za-row sv-split-grid');
      cells.forEach((c) => {
        const col = el('div', 'za-col sv-split-cell');
        [...c.children].forEach((n) => col.append(isMedia(n) ? wrapNode(n, 'sv-split-img') : n));
        grid.append(col);
      });
      container.append(grid);
    }
  });
  if (block.classList.contains('event')) {
    const card = el('div', 'sv-event-card');
    card.append(...container.children);
    container.append(card);
    const ctas = card.querySelector('.sv-split-ctas');
    const kind = ctas && ctas.previousElementSibling;
    if (kind && kind.classList.contains('za-text')) kind.classList.add('sv-event-kind');
  }
  block.classList.add('za-section');
  block.replaceChildren(container);
}

function decorateTabs(block) {
  uid += 1;
  const base = `sv-tabs-${uid}`;
  const list = el('div', 'sv-tabs-list');
  list.setAttribute('role', 'tablist');
  const panels = el('div', 'sv-tabs-panels');
  const tabs = [];
  [...block.children].forEach((r, i) => {
    const [label, body] = [...r.children];
    if (!label || !body) return;
    // EW7: the authored label is never hosted by a <button>; its wrapper takes the tab role
    const tab = el('div', 'sv-tab');
    tab.append(...label.children);
    tab.id = `${base}-t${i}`;
    tab.setAttribute('role', 'tab');
    tab.tabIndex = 0;
    tab.setAttribute('aria-controls', `${base}-p${i}`);
    const panel = el('div', 'sv-tabs-panel');
    panel.id = `${base}-p${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    // panel: [title, text, link, picture] split, then the tour group (heading + text + embed)
    const nodes = [...body.children];
    const second = nodes.findIndex((n, j) => j > 0 && isHeading(n));
    const first = second > 0 ? nodes.slice(0, second) : nodes;
    const rest = second > 0 ? nodes.slice(second) : [];
    const split = el('div', 'za-row sv-split');
    const media = first.filter(isMedia);
    split.append(textCol(first.filter((n) => !media.includes(n))));
    if (media.length) split.append(mediaCol(media));
    panel.append(split);
    if (rest.length) {
      const tour = el('div', 'sv-tabs-tour');
      rest.forEach((n) => {
        const a = n.tagName === 'P' && n.querySelector('a[href]');
        if (a && n.textContent.trim() === a.href.trim()) {
          const iframe = el('iframe', 'sv-tabs-iframe');
          iframe.src = a.href;
          iframe.title = rest.find(isHeading)?.textContent.trim() || 'Interactive tour';
          iframe.loading = 'lazy';
          iframe.allow = 'fullscreen; clipboard-write';
          iframe.allowFullscreen = true;
          tour.append(iframe);
          n.remove();
        } else tour.append(isHeading(n) ? n : wrapNode(n, 'za-text'));
      });
      panel.append(tour);
    }
    list.append(tab);
    panels.append(panel);
    tabs.push({ tab, panel });
  });
  const open = (idx) => tabs.forEach((t, j) => {
    const on = j === idx;
    t.tab.classList.toggle('is-active', on);
    t.tab.setAttribute('aria-selected', String(on));
    t.panel.hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.tab.addEventListener('click', () => open(i));
    t.tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });
  open(0);
  const container = el('div', 'za-container');
  container.append(list, panels);
  block.classList.add('za-section');
  block.replaceChildren(container);
}

const CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m6 6 12 12M18 6 6 18"></path></svg>';

// `modal`: hide the decorated section as a dialog opened by links to #modal.<id> / #<id>
function makeModal(block) {
  const name = [...block.classList].find((c) => c.startsWith('modal-'));
  if (name) block.id = block.id || name.slice(6);
  block.setAttribute('role', 'dialog');
  block.setAttribute('aria-modal', 'true');
  const title = block.querySelector('h1, h2, h3');
  if (title) {
    title.id = title.id || `${block.id || 'sv-columns'}-title`;
    block.setAttribute('aria-labelledby', title.id);
  }
  block.hidden = true;
  const box = block.querySelector(':scope > .za-container');
  const close = el('button', 'sv-modal-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.innerHTML = CLOSE;
  if (box) box.prepend(close);
  const hide = () => { block.hidden = true; };
  close.addEventListener('click', hide);
  block.addEventListener('click', (e) => { if (e.target === block) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !block.hidden) hide(); });
  if (!block.id) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest(`a[href$="#${block.id}"], a[href$="#modal.${block.id}"]`);
    if (!a) return;
    e.preventDefault();
    block.hidden = false;
    close.focus();
  });
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  if (block.classList.contains('modal')) {
    if (block.classList.contains('tabs')) decorateTabs(block);
    else decorateSplit(block);
    makeModal(block);
    return;
  }
  if (block.classList.contains('tabs')) {
    decorateTabs(block);
    return;
  }
  if (block.classList.contains('media') || block.classList.contains('text')) {
    decorateSplit(block);
    return;
  }
  const card = el('div', 'sv-protect');
  const row = el('div', 'za-row');
  [...block.children].forEach((r) => {
    [...r.children].forEach((cell) => {
      const col = el('div', 'za-col sv-protect-col');
      [...cell.children].forEach((n) => {
        const a = n.querySelector('a');
        if (/^H[1-6]$/.test(n.tagName)) col.append(n);
        else if (a && n.textContent.trim() === a.textContent.trim()) {
          if (a.title === a.textContent) a.removeAttribute('title');
          col.append(wrapNode(n, a.classList.contains('button') ? 'sv-protect-cta' : 'sv-protect-link'));
        } else col.append(wrapNode(n, 'za-text'));
      });
      if (col.children.length) row.append(col);
    });
  });
  card.append(row);
  const container = el('div', 'za-container');
  container.append(card);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
