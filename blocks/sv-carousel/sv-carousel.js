/**
 * sv-carousel — resource card carousel (live slick: 4.3 / 2.3 / 1.4 cards in view,
 * 500 ms track travel, prev/next). Schema: stardust/eds-schema/service.json section 8
 * (#teaser-fc7e164e83).
 *
 * Section head: default content before the block (<h2>, optional eyebrow/lede) is
 * reabsorbed into a left-aligned head row (EW8).
 * Authoring: one row per card — cell 1: <picture>; cell 2: the kind <p> (Report, Article…)
 *   and the title link <p><a href>Title</a></p>. The card becomes the link (EW6); links to
 *   other hosts open in a new tab.
 * @ew-exempt aria-label "n of N" / "Previous" / "Next" — runtime carousel controls
 */

const KIND = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M1 0h11v13H1zm3.5 4a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zM4 7.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-3a.5.5 0 0 0-.5.5"></path><path fill="currentColor" d="M13 14V3h2v13H4v-2z"></path></svg>';
const EXT = '<svg class="sv-ext" role="img" aria-label="(opens in a new tab)" focusable="false" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>';
const ARROW_L = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="m5.052 12.85 3.549 3.55-1.202 1.202L1.798 12l5.601-5.602 1.202 1.203-3.549 3.549H21v1.7z"></path></svg>';
const ARROW_R = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg>';

function el(tag, className, html) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html) n.innerHTML = html;
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
  const col = el('div', 'za-col sv-carousel-head');
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

// the live lazy-image pattern: a transparent sizer shares the image's box (presentational, alt="")
function addSizer(host, img) {
  if (!img || host.querySelector('.sv-ii-sizer')) return;
  const sizer = el('img', 'sv-ii-sizer');
  sizer.alt = '';
  sizer.setAttribute('aria-hidden', 'true');
  sizer.src = 'data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27632%27%20height=%27532%27/%3e';
  host.prepend(sizer);
}

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());

function isExternal(href) {
  try {
    const u = new URL(href, window.location.href);
    return u.hostname !== window.location.hostname && u.hostname !== 'www.zendesk.com';
  } catch (e) {
    return false;
  }
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const rows = [...block.children];
  const track = el('div', 'sv-res-track');
  const slides = [];
  rows.forEach((r) => {
    const nodes = [...r.children].flatMap((c) => [...c.children]);
    const linkP = nodes.find((n) => n.querySelector('a[href]') && !isMedia(n));
    if (!linkP) return;
    const link = linkP.querySelector('a[href]');
    const card = el('a', 'sv-res-card');
    card.href = link.href;
    if (isExternal(link.href)) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
    const media = nodes.find(isMedia);
    if (media) {
      const box = wrapNode(media, 'sv-res-img');
      addSizer(box, media.querySelector('img') || media);
      card.append(box);
    }
    const content = el('div', 'sv-res-content');
    // paragraphs after the title link: a trailing label ("Read the article", legacy cards)
    const more = nodes.slice(nodes.indexOf(linkP) + 1).filter((n) => n.tagName === 'P' && n.textContent.trim() && !isMedia(n));
    nodes.forEach((n) => {
      if (n === media || n === linkP || more.includes(n) || n.tagName !== 'P' || !n.textContent.trim()) return;
      const kind = el('div', 'sv-res-kind');
      n.insertAdjacentHTML('afterbegin', KIND);
      kind.append(n);
      content.append(kind);
    });
    link.replaceWith(...link.childNodes);
    content.append(wrapNode(linkP, 'sv-res-title'));
    more.forEach((n) => content.append(wrapNode(n, 'sv-res-more')));
    card.append(content);
    if (card.target === '_blank') card.insertAdjacentHTML('beforeend', EXT);
    const slide = el('div', 'sv-res-slide');
    slide.setAttribute('role', 'group');
    slide.append(card);
    slides.push(slide);
    track.append(slide);
  });
  slides.forEach((s, i) => s.setAttribute('aria-label', `${i + 1} of ${slides.length}`));

  const list = el('div', 'sv-res-list');
  list.append(track);
  const nav = el('div', 'sv-res-nav');
  const prev = el('button', 'sv-round', `<span>${ARROW_L}</span>`);
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous');
  const next = el('button', 'sv-round', `<span>${ARROW_R}</span>`);
  next.type = 'button';
  next.setAttribute('aria-label', 'Next');
  nav.append(prev, next);
  const res = el('div', 'sv-res');
  res.setAttribute('role', 'region');
  res.append(list, nav);

  let idx = 0;
  let busy = false;
  const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : list.clientWidth);
  const maxIdx = () => {
    const s = step();
    if (!s) return 0;
    return Math.max(0, Math.ceil((slides.length * s - list.clientWidth) / s - 0.01));
  };
  const go = (n) => {
    idx = Math.max(0, Math.min(n, maxIdx()));
    track.style.transform = `translateX(${-idx * step()}px)`;
    prev.disabled = idx === 0;
    next.disabled = idx >= maxIdx();
  };
  // slick ignores clicks while the 500 ms slide transition runs
  const move = (d) => {
    if (busy) return;
    busy = true;
    setTimeout(() => { busy = false; }, 500);
    go(idx + d);
  };
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  prev.disabled = true;
  if ('ResizeObserver' in window) new ResizeObserver(() => go(idx)).observe(list);

  const row = el('div', 'za-row');
  const col = el('div', 'za-col');
  col.append(res);
  row.append(col);
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
