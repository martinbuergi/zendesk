/**
 * co-carousel — locations carousel (live slick .gffFwE: 4 / 2.33 / 1.33 cards in view, no loop,
 * 500 ms track travel of ceil(list / show) px per click, prev disabled at the start).
 * Schema: stardust/eds-schema/company.json section 4 (#teaser-f67eba53a7).
 *
 * Section head: default content before the block (<h2>, lede, CTA paragraph) is reabsorbed
 * into a centred head row (EW8).
 * Authoring: one row per card — cell 1: the image; cell 2: the title <p> (optional kind <p>
 * before it). A link in the title makes the card a link (EW6); without one the card is an
 * <a> with no destination, as on the live page.
 * @ew-exempt hidden slick buttons "Previous" / "Next" — runtime carousel controls
 * @ew-exempt aria-label "n of N" / "Previous" / "Next" — runtime carousel controls
 */

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

// live intrinsic-image pattern: a transparent sizer shares the image box (presentational)
function addSizer(box, img, fw, fh) {
  const w = (img && img.getAttribute('width')) || fw;
  const h = (img && img.getAttribute('height')) || fh;
  if (!img || !w || !h || box.querySelector('.co-ii-sizer')) return;
  const s = el('img', 'co-ii-sizer');
  s.alt = '';
  s.setAttribute('aria-hidden', 'true');
  s.src = `data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27${w}%27%20height=%27${h}%27/%3e`;
  box.prepend(s);
  box.classList.add('has-sizer');
}

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isCta = (n) => n.tagName === 'P' && !!n.querySelector('a[href]')
  && (n.classList.contains('button-wrapper') || !!n.querySelector('strong > a, em > a, a.button'));

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'za-row co-head');
  const col = el('div', 'za-col co-head-col');
  const body = el('div', 'za-text co-text');
  const links = el('div', 'co-links');
  [...wrapper.children].forEach((n) => {
    if (/^H[1-6]$/.test(n.tagName)) col.append(n);
    else if (isCta(n)) links.append(n);
    else body.append(n);
  });
  if (body.children.length) col.append(body);
  if (links.children.length) col.append(links);
  wrapper.remove();
  row.append(col);
  return row;
}

function cellNodes(row) {
  return [...row.children].flatMap((c) => {
    const kids = [...c.children];
    if (kids.length) return kids;
    if (!c.textContent.trim()) return [];
    // HARNESS-ONLY fallback: wrap the cell's text nodes (never fires on DA content)
    const p = el('p');
    p.append(...c.childNodes);
    return [p];
  });
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const track = el('div', 'co-car-track');
  const slides = [];
  [...block.children].forEach((r) => {
    const nodes = cellNodes(r);
    const media = nodes.find(isMedia);
    const texts = nodes.filter((n) => n !== media);
    if (!media && !texts.length) return;
    const card = el('a', 'co-card');
    const titleP = texts[texts.length - 1];
    const link = titleP && titleP.querySelector('a[href]');
    if (link) {
      card.href = link.href;
      link.replaceWith(...link.childNodes);
    }
    if (media) {
      const box = el('span', 'co-ii');
      box.append(media);
      addSizer(box, media.matches('img') ? media : media.querySelector('img'), 710, 532);
      card.append(box);
    }
    const content = el('div', 'co-card-content');
    const kind = el('div', 'co-card-kind');
    texts.slice(0, -1).forEach((n) => kind.append(n));
    content.append(kind);
    if (titleP) content.append(wrapNode(titleP, 'co-card-title'));
    card.append(content);
    const slide = el('div', 'co-car-slide');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.append(card);
    slides.push(slide);
    track.append(slide);
  });
  slides.forEach((s, i) => s.setAttribute('aria-label', `${i + 1} of ${slides.length}`));
  track.style.setProperty('--co-n', String(Math.max(slides.length, 1)));

  const list = el('div', 'co-car-list');
  list.append(track);
  const nav = el('div', 'co-car-nav');
  const prev = el('button', 'co-round', `<span>${ARROW_L}</span>`);
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous');
  const next = el('button', 'co-round', `<span>${ARROW_R}</span>`);
  next.type = 'button';
  next.setAttribute('aria-label', 'Next');
  nav.append(prev, next);
  const car = el('div', 'co-car');
  car.setAttribute('role', 'region');
  // slick's own (hidden) arrow buttons, kept as on the live page
  const slickPrev = el('button', 'co-car-slick');
  slickPrev.type = 'button';
  slickPrev.hidden = true;
  slickPrev.textContent = ' Previous';
  const slickNext = el('button', 'co-car-slick');
  slickNext.type = 'button';
  slickNext.hidden = true;
  slickNext.textContent = ' Next';
  car.append(slickPrev, list, slickNext, nav);

  let idx = 0;
  let busy = false;
  const show = () => parseFloat(getComputedStyle(track).getPropertyValue('--co-show')) || 1;
  // slick travel = its own slide width, ceil(list / show) px, gap ignored (276 px at 1440)
  const step = () => Math.ceil(list.clientWidth / show());
  const maxIdx = () => Math.max(0, Math.ceil(slides.length - show()));
  const go = (n) => {
    idx = Math.max(0, Math.min(n, maxIdx()));
    track.style.transform = `translateX(${-idx * step()}px)`;
    prev.disabled = idx === 0;
    next.disabled = idx >= maxIdx();
    // slick state classes: current = first shown, active = the shown window
    const inView = Math.ceil(show());
    slides.forEach((s, i) => {
      s.classList.toggle('slick-current', i === idx);
      s.classList.toggle('slick-active', i >= idx && i < idx + inView);
    });
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

  const grid = el('div', 'co-grid');
  grid.append(car);
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(grid);
  block.classList.add('za-section');
  block.replaceChildren(container);
  go(0);
}
