/**
 * sv-cards — centered icon cards in one row (live .fOIWOy "Why choose" grid):
 * icon/image, title, text, optional link per card; cards share the row equally >= 768.
 * Schema: stardust/eds-schema/service.json section 4 (#teaser-f948fb8c26).
 *
 * Section head: default content before the block (eyebrow <p>, <h2>, optional lede <p>)
 * is reabsorbed into the centered head row (EW8).
 * Authoring: one row per card — cell 1: <picture> (64 px icon); cell 2: title <h3>,
 *   text <p>(s), optional link <p>. A single cell per row also works.
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

// stat figure text: digits stay full size, unit characters (<, %, k, weeks) get .sv-stat-ch
function splitFigure(host) {
  if (host.querySelector('.sv-stat-ch')) return;
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => {
    if (!/\d/.test(t.textContent) || !/[^\d.,#\-–\s]/.test(t.textContent)) return;
    const frag = document.createDocumentFragment();
    t.textContent.split(/([^\d.,#\-–\s]+)/).filter((x) => x !== '').forEach((x) => {
      if (/[^\d.,#\-–\s]/.test(x)) {
        const span = el('span', 'sv-stat-ch');
        span.textContent = x;
        frag.append(span);
      } else frag.append(document.createTextNode(x));
    });
    t.replaceWith(frag);
  });
}

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
    else if (hIdx < 0 || i < hIdx) col.append(wrapNode(n, 'za-eyebrow'));
    else col.append(wrapNode(n, 'za-text sv-lead'));
  });
  wrapper.remove();
  row.append(col);
  return row;
}

// the live lazy-image pattern: a transparent sizer shares the image's box (presentational, alt="")
function addSizer(host, img) {
  if (!img || host.querySelector('.sv-ii-sizer')) return;
  const w = img.getAttribute('width') || 64;
  const h = img.getAttribute('height') || 64;
  const sizer = el('img');
  sizer.className = 'sv-ii-sizer';
  sizer.alt = '';
  sizer.setAttribute('aria-hidden', 'true');
  sizer.src = `data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27${w}%27%20height=%27${h}%27/%3e`;
  host.prepend(sizer);
}

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const grid = el('div', 'sv-why');
  const row = el('div', 'za-row sv-why-row');
  const statRow = el('div', 'za-row sv-why-row sv-why-stats');
  const foot = el('div', 'sv-why-foot');
  [...block.children].forEach((r) => {
    const nodes = [...r.children].flatMap((c) => [...c.children]);
    if (!nodes.length) return;
    // foot row: link paragraphs only (a closing CTA under the grid)
    if (r.children.length === 1 && nodes.every((n) => n.tagName === 'P' && n.querySelector('a')
      && n.textContent.trim() === n.querySelector('a').textContent.trim())) {
      nodes.forEach((n) => foot.append(n));
      return;
    }
    // stat row: a figure paragraph (<p><strong>70%</strong></p>) and its label, no title
    const fig = nodes[0];
    if (!nodes.some((n) => /^H[1-6]$/.test(n.tagName)) && fig.tagName === 'P'
      && fig.firstElementChild && fig.firstElementChild.tagName === 'STRONG'
      && fig.textContent.trim() === fig.firstElementChild.textContent.trim()) {
      const stat = el('div', 'sv-why-stat');
      splitFigure(fig);
      stat.append(wrapNode(fig, 'sv-why-fig'));
      nodes.slice(1).forEach((n) => stat.append(wrapNode(n, 'sv-why-label')));
      const sc = el('div', 'za-col sv-why-col');
      sc.append(stat);
      statRow.append(sc);
      return;
    }
    const card = el('div', 'sv-why-card');
    // a link-free label paragraph before the title ("Most popular") marks the featured card
    const tIdx = nodes.findIndex((n) => /^H[1-6]$/.test(n.tagName));
    if (tIdx > 0 && nodes.slice(0, tIdx).some((n) => n.tagName === 'P' && !n.querySelector('a, picture, img'))) card.classList.add('sv-why-featured');
    const media = nodes.find(isMedia);
    const title = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
    if (media) {
      const ii = wrapNode(media, 'sv-ii');
      addSizer(ii, media.matches('img') ? media : media.querySelector('img'));
      card.append(wrapNode(ii, 'sv-why-media'));
    }
    if (title) card.append(wrapNode(title, 'sv-why-title'));
    const text = el('div', 'za-text sv-why-text');
    nodes.forEach((n) => {
      if (n === media || n === title) return;
      n.querySelectorAll('a').forEach((a) => { if (a.title === a.textContent) a.removeAttribute('title'); });
      text.append(n);
    });
    if (text.children.length) card.append(text);
    const col = el('div', 'za-col sv-why-col');
    col.append(card);
    row.append(col);
  });
  grid.append(row);
  if (statRow.children.length) grid.append(statRow);
  if (foot.children.length) grid.append(foot);
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(grid);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
