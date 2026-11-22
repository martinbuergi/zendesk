/**
 * sv-embed — framed third-party embed (live Storylane guided tour, embed-passthrough:
 * the iframe keeps the authored src). Schema: stardust/eds-schema/service.json section 6
 * (#teaser-0de1c10d53).
 *
 * Section head: default content before the block (eyebrow <p>, <h2>, lede <p>) is
 * reabsorbed into the centered head row (EW8).
 * Authoring: one row, one cell: <p><a href="https://app.storylane.io/demo/…?embed=inline">Title</a></p>
 *   — the link text becomes the iframe title.
 * Variant `desktop`: the section is not rendered below 768 px (live behaviour on /service/).
 *
 * @variants block: desktop (default none)
 * @ew-exempt link (cell 1) — embed source URL, rendered as the iframe (title from its text)
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

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const isCta = (n) => n.tagName === 'P' && !!n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();
const PLAY = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"></path></svg>';

function textCol(nodes) {
  const col = el('div', 'za-col sv-split-text');
  let hIdx = nodes.findIndex(isHeading);
  // two leading headings (legacy pages): the first is the eyebrow, the second the title
  if (hIdx === 0 && nodes[1] && isHeading(nodes[1])) hIdx = 1;
  const ctas = el('div', 'sv-split-ctas');
  nodes.forEach((n, i) => {
    if (hIdx > 0 && i < hIdx) col.append(wrapNode(n, 'za-eyebrow'));
    else if (isHeading(n)) col.append(n);
    else if (isCta(n)) ctas.append(n);
    else col.append(wrapNode(n, 'za-text'));
  });
  if (ctas.children.length) col.append(ctas);
  return col;
}

// media column: an .mp4 link → muted looping video; a wistia link → the poster picture with a
// play control that swaps in the player (embed-passthrough, same media id); pictures as-is
function mediaCol(nodes) {
  const col = el('div', 'za-col sv-split-media');
  const frame = el('div', 'sv-split-frame');
  const wl = nodes.map((n) => n.querySelector && n.querySelector('a[href*="wistia"]')).find(Boolean);
  nodes.forEach((n) => {
    const a = n.querySelector && n.querySelector('a[href]');
    if (a && a !== wl && !n.querySelector('picture, img')) {
      const v = document.createElement('video');
      v.src = a.href;
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('aria-label', a.textContent.trim());
      a.replaceWith(v);
      frame.append(wrapNode(n, 'sv-split-video'));
    } else if (a && a === wl) {
      const play = wrapNode(n, 'sv-split-play');
      a.insertAdjacentHTML('afterbegin', PLAY);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const m = /(?:iframe|medias)\/([a-z0-9]+)/i.exec(a.href);
        const iframe = el('iframe', 'sv-split-iframe');
        iframe.src = `https://fast.wistia.net/embed/iframe/${m ? m[1] : ''}?autoPlay=true&videoFoam=true`;
        iframe.title = a.textContent.trim() || 'Video';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        frame.append(iframe);
        frame.classList.add('is-playing');
      });
      frame.append(play);
    } else frame.append(wrapNode(n, 'sv-split-img'));
  });
  col.append(frame);
  return col;
}

function decorateVideo(block) {
  const rows = [...block.children];
  // D1: a Wistia URL authored as default content right after the block joins the media cell
  const after = block.parentElement && block.parentElement.nextElementSibling;
  if (after && after.classList.contains('default-content-wrapper') && rows[0]) {
    const vp = [...after.children].find((n) => n.tagName === 'P' && n.querySelector('a[href*="wistia"]'));
    if (vp) {
      let cell = rows[0].children[1];
      if (!cell) {
        cell = document.createElement('div');
        rows[0].append(cell);
      }
      cell.append(vp);
      if (!after.children.length) after.remove();
    }
  }
  const container = el('div', 'za-container za-row-gap');
  rows.forEach((r, ri) => {
    const cells = [...r.children];
    if (ri === 0) {
      const row = el('div', 'za-row sv-split');
      row.append(textCol([...cells[0].children]));
      if (cells[1] && cells[1].children.length) row.append(mediaCol([...cells[1].children]));
      container.append(row);
    } else {
      const box = el('div', 'sv-split-box');
      box.append(textCol(cells.flatMap((c) => [...c.children])));
      container.append(box);
    }
  });
  block.classList.add('za-section');
  block.replaceChildren(container);
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  if (block.classList.contains('video')) {
    decorateVideo(block);
    return;
  }
  const head = buildHead(block);
  const link = block.querySelector('a[href]');
  const frame = el('div', 'sv-embed-frame');
  if (link) {
    const iframe = el('iframe', 'sv-embed-iframe');
    iframe.src = link.href;
    iframe.title = link.textContent.trim();
    iframe.name = 'sl-embed';
    iframe.loading = 'lazy';
    iframe.allow = 'fullscreen; clipboard-write';
    iframe.allowFullscreen = true;
    frame.append(iframe);
  }
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(frame);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
