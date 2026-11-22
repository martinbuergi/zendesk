/**
 * sv-accordion — benefits accordion with a swapping media column (live .gRaSNj:
 * image 6/12 + accordion 5/12, one item open at a time).
 * Schema: stardust/eds-schema/service.json section 2 (#benefits).
 *
 * Section head: default content before the block (eyebrow <p>, <h2>, optional lede <p>)
 * is reabsorbed into the centered head row (EW8).
 * Authoring: one row per item — cell 1: the item title (<h3>); cell 2: body <p>(s)
 *   (links allowed) and an optional <picture> (a second <picture> is its overlay
 *   card). The open item's picture shows in the
 *   media column at >= 768px and inside the panel below it.
 * Variant `plain`: no media column (text-only accordion, full 8/12 width).
 * Variant `legacy` below 768px: items stacked open, picture first (`sv-acc-stacked`, set by JS).
 *
 * @variants block: plain (default none)
 */

const SVG_CHEVRON = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="m19.352 9.218-7.366 7.366-7.338-7.338L5.85 8.044l6.136 6.136 6.164-6.164z" clip-rule="evenodd"></path></svg>';

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

function stripInstrumentation(node) {
  node.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  node.removeAttribute('data-prose-index');
  node.removeAttribute('data-image-index');
  return node;
}

// section head: the default content before the block, moved (EW8)
function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'za-row sv-head');
  const col = el('div', 'za-col sv-head-col');
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

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const plain = block.classList.contains('plain');
  const head = buildHead(block);
  const rows = [...block.children];
  uid += 1;
  const base = `sv-acc-${uid}`;

  const accm = el('div', 'sv-accm');
  const accmRow = el('div', 'za-row sv-accm-row');
  const mediaCol = el('div', 'za-col sv-accm-media');
  const listCol = el('div', 'za-col sv-accm-list');
  const acc = el('div', 'sv-acc');

  const items = [];
  // a one-cell row is not an item: an aside card under the accordion (legacy promo card)
  const aside = el('div', 'sv-acc-aside');
  rows.forEach((row, i) => {
    if (row.children.length === 1 && rows.some((r) => r.children.length > 1)) {
      [...row.firstElementChild.children].forEach((n) => aside.append(n));
      return;
    }
    const nodes = [];
    [...row.children].forEach((cell) => nodes.push(...cell.children));
    const title = nodes.find((n) => /^H[1-6]$/.test(n.tagName))
      || nodes.find((n) => n.tagName === 'P' && !isMedia(n));
    if (!title) return;
    // the first picture is the item's media; a further one is its overlay card (legacy mobile)
    const medias = nodes.filter((n) => n !== title && isMedia(n));
    const media = medias[0];
    const body = nodes.filter((n) => n !== title && !medias.includes(n));

    const item = el('div', 'sv-acc-item');
    const headEl = el('div', 'sv-acc-head');
    // EW7: the authored heading is never hosted by a <button>; its wrapper takes the
    // button role (keyboard + aria), the chevron is decorative
    const titleWrap = wrapNode(title, 'sv-acc-title');
    title.id = title.id || `${base}-t${i}`;
    titleWrap.id = `${base}-b${i}`;
    titleWrap.setAttribute('role', 'button');
    titleWrap.tabIndex = 0;
    titleWrap.setAttribute('aria-controls', `${base}-p${i}`);
    const toggle = el('span', 'sv-acc-btn');
    toggle.setAttribute('aria-hidden', 'true');
    toggle.innerHTML = SVG_CHEVRON;
    headEl.append(titleWrap, toggle);

    const panel = el('div', 'sv-acc-panel');
    panel.id = `${base}-p${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', titleWrap.id);
    const inner = el('div', 'sv-acc-inner');
    const text = el('div', 'za-text');
    body.forEach((n) => text.append(n));
    inner.append(text);
    if (media) {
      const img = el('div', 'sv-accm-img');
      img.append(...medias);
      mediaCol.append(img);
      const mm = el('div', 'sv-acc-mmedia');
      medias.forEach((m) => {
        const clone = stripInstrumentation(m.cloneNode(true));
        clone.querySelectorAll('img').forEach((im) => { im.alt = ''; im.loading = 'lazy'; });
        mm.append(clone);
      });
      inner.append(mm);
      item.media = img;
    }
    panel.append(inner);
    item.append(headEl, panel);
    acc.append(item);
    items.push({
      item, toggle: titleWrap, panel, media: item.media,
    });
  });

  // legacy (gen B) below 768px: every item open and stacked, no toggling (live Basestyle mobile)
  const mq = block.classList.contains('legacy') && window.matchMedia ? window.matchMedia('(width >= 768px)') : null;
  const stacked = () => !!mq && !mq.matches;
  let current = 0;
  const open = (idx) => {
    current = idx;
    if (stacked()) {
      block.classList.add('sv-acc-stacked');
      items.forEach((it) => {
        it.item.classList.add('is-open');
        it.toggle.setAttribute('aria-expanded', 'true');
        it.panel.setAttribute('aria-hidden', 'false');
        it.panel.removeAttribute('inert');
        if (it.media) it.media.classList.toggle('is-active', it === items[idx]);
      });
      return;
    }
    block.classList.remove('sv-acc-stacked');
    items.forEach((it, j) => {
      const on = j === idx;
      it.item.classList.toggle('is-open', on);
      it.toggle.setAttribute('aria-expanded', String(on));
      it.panel.setAttribute('aria-hidden', String(!on));
      if (on) it.panel.removeAttribute('inert'); else it.panel.setAttribute('inert', '');
      if (it.media) it.media.classList.toggle('is-active', on);
    });
  };
  items.forEach((it, i) => {
    it.item.querySelector('.sv-acc-head').addEventListener('click', () => {
      if (!stacked() && !it.item.classList.contains('is-open')) open(i);
    });
    it.toggle.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (!stacked() && !it.item.classList.contains('is-open')) open(i);
    });
  });
  open(0);
  if (mq) mq.addEventListener('change', () => open(current));

  listCol.append(acc);
  if (mediaCol.children.length && !plain) accmRow.append(mediaCol);
  else block.classList.add('sv-accordion-plain');
  accmRow.append(listCol);
  accm.append(accmRow);

  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(accm);
  if (aside.children.length) {
    const media = [...aside.children].filter(isMedia);
    const box = el('div', 'sv-acc-aside-text');
    [...aside.children].filter((n) => !media.includes(n)).forEach((n) => box.append(n));
    if (media.length) {
      const m = el('div', 'sv-acc-aside-media');
      media.forEach((n) => m.append(n));
      aside.append(m);
    }
    aside.append(box);
    container.append(aside);
  }
  block.classList.add('za-section');
  block.replaceChildren(container);
}
