/**
 * hp-res — "Additional resources" rail: a heading over link cards (image, type eyebrow with
 * icon and optional tag, title, "Learn more").
 *
 * Authoring: the heading is default content before the block (reabsorbed, EW8; a leading
 * heading-only row is the fallback). Rows: image | <p> type (a trailing <code> becomes the
 * tag pill), <p> title, <p><a> link — the link's href makes the whole card a link (EW6).
 * The type word picks the icon: product | report | guide | article (other words: no icon).
 */

const ICONS = {
  product: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M7.5 4.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0z"></path><path fill="currentColor" d="M8 6C5.72 6 4 7.67 4 9.929V11h8V9.929C12 7.67 10.28 6 8 6"></path><path fill="currentColor" d="M16 10.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5"></path><path fill="currentColor" d="M10.75 5.737a.5.5 0 0 1-.183-.683l1-1.732a.5.5 0 1 1 .866.5l-1 1.732a.5.5 0 0 1-.683.183"></path><path fill="currentColor" d="M12.946 7.067a.5.5 0 0 0 .5.866l1.732-1a.5.5 0 0 0-.5-.866z"></path><path fill="currentColor" d="M0 10.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 0-1h-2a.5.5 0 0 0-.5.5"></path><path fill="currentColor" d="M5.433 5.054a.5.5 0 1 1-.866.5l-1-1.732a.5.5 0 1 1 .866-.5z"></path><path fill="currentColor" d="M3.237 7.75a.5.5 0 0 0-.183-.683l-1.732-1a.5.5 0 1 0-.5.866l1.732 1a.5.5 0 0 0 .683-.183"></path><path fill="currentColor" d="M.5 13a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1z"></path></svg>',
  report: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm4 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2M7 9a.5.5 0 0 0-1 0v2.5a.5.5 0 0 0 1 0zm-3 1.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0zm5.5-1a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V10a.5.5 0 0 0-.5-.5M13 9a.5.5 0 0 0-1 0v2.5a.5.5 0 0 0 1 0zm-.5-4.5h-5v2h5z"></path></svg>',
  guide: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M8.293 0h7.266l.002.004A.5.5 0 0 1 16 .5v8a.5.5 0 0 1-1 0V5H8.293l2.5-2.5z"></path><path fill="currentColor" d="M2 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4"></path><path fill="currentColor" d="M13.724 8.053C12.18 7.282 9.95 6.53 8.049 6.283c-.944-.124-1.86-.131-2.583.082-.366.108-.707.28-.972.546-.272.272-.441.62-.49 1.03-.054.444.036.84.254 1.177.21.326.517.563.844.745.613.34 1.427.55 2.162.74l.097.025c.803.208 1.506.4 1.987.688.232.138.378.28.46.426.078.136.12.31.08.564-.057.364-.38.685-1.218.909-.814.217-1.925.285-3.17.285a.5.5 0 0 0 0 1c1.255 0 2.479-.066 3.428-.32.925-.246 1.792-.733 1.948-1.718.071-.452.003-.86-.197-1.213-.196-.344-.494-.598-.817-.792-.63-.377-1.487-.6-2.25-.797l-.02-.005c-.8-.207-1.506-.39-2.005-.667-.243-.135-.4-.273-.489-.412a.74.74 0 0 1-.102-.516.72.72 0 0 1 .205-.443c.115-.114.291-.217.548-.293.524-.155 1.277-.167 2.17-.05 1.776.232 3.9.944 5.357 1.673a.5.5 0 1 0 .448-.894"></path></svg>',
  article: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M1 0h11v13H1zm3.5 4a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zM4 7.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-3a.5.5 0 0 0-.5.5"></path><path fill="currentColor" d="M13 14V3h2v13H4v-2z"></path></svg>',
};
const PREV_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="m5.052 12.85 3.549 3.55-1.202 1.202L1.798 12l5.601-5.602 1.202 1.203-3.549 3.549H21v1.7z"></path></svg>';
const NEXT_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg>';

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));

function takeHead(block, rows) {
  const wrap = block.parentElement && block.parentElement.previousElementSibling;
  if (wrap && wrap.classList.contains('default-content-wrapper')) {
    const nodes = [...wrap.children];
    wrap.remove();
    return nodes;
  }
  const nodes = [];
  while (rows.length && rows[0].querySelector('h1, h2, h3') && !rows[0].querySelector('picture, img')) {
    rows.shift().querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

function buildCard(row, i, n) {
  const nodes = [];
  row.querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  const mediaNode = nodes.find((x) => mediaOf(x));
  const linkP = nodes.filter((x) => x !== mediaNode && x.querySelector('a')).pop();
  const textNodes = nodes.filter((x) => x !== mediaNode && x !== linkP);
  const [eyebrow, ...titles] = textNodes.length > 1 ? textNodes : [null, ...textNodes];

  const card = el('a', 'hp-rcard');
  const link = linkP ? linkP.querySelector('a') : null;
  if (link) {
    card.href = link.getAttribute('href');
    link.replaceWith(...link.childNodes);
  }
  if (mediaNode) {
    const m = mediaOf(mediaNode);
    card.append(el('div', 'hp-rcard-media', m.closest('p') || m.closest('picture') || m));
  }
  const body = el('div', 'hp-rcard-body');
  if (eyebrow) {
    const box = el('div', 'za-eyebrow hp-rcard-eyebrow');
    const lead = eyebrow.firstChild && eyebrow.firstChild.nodeType === 3
      ? eyebrow.firstChild.textContent : eyebrow.textContent;
    const word = lead
      .trim().toLowerCase();
    if (ICONS[word]) box.innerHTML = ICONS[word];
    box.append(eyebrow);
    body.append(box);
  }
  if (titles.length) body.append(el('div', 'hp-rcard-title', ...titles));
  if (linkP) body.append(el('div', 'hp-rcard-more', el('div', 'za-linkroot', linkP)));
  card.append(body);
  const slide = el('div', 'hp-res-slide', card);
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${i + 1} of ${n}`);
  return slide;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headNodes = takeHead(block, rows);
  const cards = rows.filter((r) => r.textContent.trim() || r.querySelector('picture, img'));
  const slides = cards.map((r, i) => buildCard(r, i, cards.length));
  const track = el('div', 'hp-res-track', ...slides);
  const carousel = el('div', 'hp-res-carousel', track);
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-roledescription', 'carousel');

  const prev = el('button', 'hp-roundbtn');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous');
  prev.innerHTML = PREV_SVG;
  prev.disabled = true;
  const next = el('button', 'hp-roundbtn');
  next.type = 'button';
  next.setAttribute('aria-label', 'Next');
  next.innerHTML = NEXT_SVG;
  carousel.append(el('div', 'hp-res-nav', el('div', 'hp-res-arrows', prev, next)));

  let index = 0;
  const step = () => {
    if (slides.length < 2) return 0;
    return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
  };
  const maxIndex = () => {
    const s = step();
    if (!s) return 0;
    const overflow = track.scrollWidth - track.clientWidth;
    return Math.max(0, Math.ceil(overflow / s - 0.01));
  };
  const move = (i) => {
    index = Math.max(0, Math.min(i, Math.max(maxIndex(), 0)));
    track.style.setProperty('--ri', String(index));
    track.style.setProperty('--rstep', `${step()}px`);
    prev.disabled = index === 0;
    next.disabled = index >= maxIndex() && index > 0;
  };
  prev.addEventListener('click', () => move(index - 1));
  next.addEventListener('click', () => move(index + 1));

  block.classList.add('za-section');
  const container = el('div', 'za-container');
  headNodes.forEach((h) => container.append(isHeading(h) ? el('div', 'hp-res-title', h) : h));
  container.append(carousel);
  block.replaceChildren(container);
}
