/**
 * bl-group — one blog category group: title + "View more" link, then a slick-style story carousel
 * (4 across from 1120, Prev/Next arrows below 1120). Several groups stack in one section.
 *
 * Authoring:
 *   head   <h2>Category</h2> <p><a href="/blog/category/">View more</a></p>   (the first row
 *     without an image)
 *   card   image | <h3><a href>title</a></h3> <p>description (optional)</p> <p><a>tag</a>
 *     <a>tag</a></p> (optional)
 * A card's tag paragraph is the one made only of links; it stays outside the card link.
 *
 * Variants (listing hubs: marketplace, customer): `grid` (static 2/3/4-up tile grid, no carousel),
 * `logos` (a logo strip: one image per row), `no-head` (cards only), `legacy` (gen-B type).
 *   head   any first rows without an image: <h2|h3>title</h2> <h5>subtitle</h5> <p><a>more</a></p>
 *   tile   one cell in source order: images (first = media, later = logo), <p>eyebrow</p> (before
 *          the title), <h3|h4|p><strong> title (its link is the tile link), <p> lines,
 *          <p>:bl-rating-N:</p>,
 *          <p><a>CTA</a></p> (when the title carries no link)
 */

const SVG = {
  // eslint-disable-next-line max-len
  prev: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="m5.052 12.85 3.549 3.55-1.202 1.202L1.798 12l5.601-5.602 1.202 1.203-3.549 3.549H21v1.7z"></path></svg>',
  // eslint-disable-next-line max-len
  next: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg>',
  // eslint-disable-next-line max-len
  more: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M11.948 8.85H1v-1.7h10.948L9.399 4.6l1.202-1.202L15.202 8l-4.601 4.602-1.202-1.203z" clip-rule="evenodd"></path></svg>',
};

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const squash = (s) => s.replace(/\s+/g, '');
const onlyLinks = (n) => n.tagName === 'P' && !!n.querySelector('a')
  && squash(n.textContent) === [...n.querySelectorAll('a')].map((a) => squash(a.textContent)).join('');

function rowNodes(row) {
  const out = [];
  [...row.children].forEach((cell) => {
    let kids = [...cell.children];
    if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].querySelector('picture, img')
      && kids[0].children.length > 1) {
      kids = [...kids[0].children];
    }
    out.push(...kids);
  });
  return out;
}

/** story card: card-as-link (EW6) around media + title + description; tags outside the link */
function storyCard(nodes) {
  const media = nodes.find((n) => mediaOf(n));
  const heading = nodes.find(isHeading);
  const tags = nodes.filter((n) => n !== media && n !== heading && onlyLinks(n));
  const inner = heading && heading.querySelector('a');
  const link = el('a', 'bl-card-link');
  link.href = inner ? inner.href : '#';
  if (inner) inner.replaceWith(...inner.childNodes);
  if (media) link.append(el('div', 'bl-card-media', media.closest('p') || media));
  if (heading) link.append(el('div', 'bl-card-title', heading));
  nodes.filter((n) => n !== media && n !== heading && !tags.includes(n))
    .forEach((n) => link.append(el('div', 'bl-card-desc', n)));
  const card = el('div', 'bl-card', link);
  if (tags.length) card.append(el('div', 'bl-tags', ...tags));
  return card;
}

function arrows(track) {
  const prev = el('button', 'bl-arrow');
  const next = el('button', 'bl-arrow');
  [[prev, 'Previous', -1, SVG.prev], [next, 'Next', 1, SVG.next]].forEach(([b, label, dir, svg]) => {
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.dataset.dir = dir;
    b.innerHTML = svg;
  });
  let index = 0;
  const go = (dir) => {
    const slides = [...track.children];
    index = Math.max(0, Math.min(slides.length - 1, index + dir));
    track.style.transform = index ? `translateX(${-slides[index].offsetLeft}px)` : '';
    slides.forEach((s, i) => {
      s.classList.toggle('slick-current', i === index);
      s.classList.toggle('slick-active', i === index);
    });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  prev.disabled = true;
  if (track.children.length < 2) next.disabled = true;
  if (track.firstElementChild) track.firstElementChild.classList.add('slick-current', 'slick-active');
  return el('div', 'bl-arrows', prev, next);
}

/** listing tile (variants): source order kept, every authored node moved into a classed slot */
function tile(nodes, asCard = true) {
  const titleIdx = nodes.findIndex((n) => isHeading(n) || (n.tagName === 'P' && n.querySelector(':scope > strong') && !mediaOf(n)));
  const isRating = (n) => !!n.querySelector('.icon[class*="icon-bl-rating-"]');
  const title = titleIdx >= 0 ? nodes[titleIdx] : null;
  // card-as-link (EW6) only when the title link is the card's single link (gen B keeps title links)
  const titleLink = title && title.querySelector('a');
  const inner = asCard && titleLink && nodes.every((n) => n === title || !n.querySelector('a'))
    ? titleLink : null;
  const box = el(inner ? 'a' : 'div', 'bl-tile-body');
  if (inner) {
    box.href = inner.href;
    inner.replaceWith(...inner.childNodes);
  }
  const card = el('div', 'bl-tile', box);
  let seenMedia = false;
  let line = 0;
  let foot = null;
  nodes.forEach((n, i) => {
    if (isRating(n)) {
      foot = el('div', 'bl-tile-foot', el('div', 'bl-tile-rating', n));
      box.append(foot);
    } else if (mediaOf(n) && !n.textContent.trim()) {
      box.append(el('div', seenMedia ? 'bl-tile-logo' : 'bl-tile-media', n));
      seenMedia = true;
    } else if (n === title) box.append(el('div', 'bl-tile-title', n));
    else if (titleIdx >= 0 && i < titleIdx) box.append(el('div', 'bl-tile-eyebrow', n));
    else if (!inner && n.tagName === 'P' && n.querySelector('a') && onlyLinks(n)) card.append(el('div', 'bl-tile-cta', n));
    else {
      line += 1;
      const slot = el('div', `bl-tile-text bl-tile-text-${line}`, n);
      if (foot && foot.children.length === 1) foot.append(slot);
      else box.append(slot);
    }
  });
  return card;
}

/** a single-paragraph cell is delivered as bare text: give it back its <p> */
function cellKids(cell) {
  if (!cell.children.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    cell.append(p);
  }
  return [...cell.children];
}

function decorateVariant(block) {
  [...block.children].forEach((row) => [...row.children].forEach(cellKids));
  const rows = [...block.children].map(rowNodes).filter((r) => r.length);
  const headRows = [];
  const tiles = [];
  rows.forEach((nodes) => {
    if (!tiles.length && !nodes.some(mediaOf)) headRows.push(...nodes);
    else tiles.push(nodes);
  });
  const parts = [];
  if (headRows.length) {
    const title = headRows.find(isHeading);
    const head = el('div', 'bl-group-head');
    const copy = el('div', 'bl-group-copy');
    headRows.forEach((n) => {
      if (n === title) copy.append(el('div', 'bl-group-title', n));
      else if (n.tagName === 'P' && n.querySelector('a') && onlyLinks(n)) {
        const a = n.querySelector('a');
        if (!a.querySelector('.bl-more-text')) a.append(el('span', 'bl-more-text', ...a.childNodes));
        head.append(el('div', 'bl-more', n));
      } else copy.append(el('div', n === title ? 'bl-group-title' : 'bl-group-text', n));
    });
    head.prepend(copy);
    parts.push(head);
  }
  const grid = el('div', 'bl-tiles');
  const asCard = !block.classList.contains('legacy');
  tiles.forEach((nodes) => grid.append(tile(nodes, asCard)));
  parts.push(grid);
  block.classList.add('za-container');
  block.replaceChildren(...parts);
}

export default function decorate(block) {
  if (['grid', 'logos', 'no-head'].some((v) => block.classList.contains(v))) {
    decorateVariant(block);
    return;
  }
  const rows = [...block.children].map(rowNodes).filter((r) => r.length);
  const headRows = [];
  const cards = [];
  rows.forEach((nodes) => {
    if (!cards.length && !nodes.some(mediaOf)) headRows.push(...nodes);
    else cards.push(nodes);
  });

  const head = el('div', 'bl-group-head');
  const title = headRows.find(isHeading);
  if (title) head.append(el('div', 'bl-group-title', title));
  headRows.filter((n) => n !== title).forEach((n) => {
    const a = n.querySelector('a');
    if (a && !a.querySelector('.bl-more-text')) {
      const text = el('span', 'bl-more-text', ...a.childNodes);
      const icon = el('span', 'bl-more-icon');
      icon.innerHTML = SVG.more;
      a.append(text, icon);
    }
    head.append(el('div', a ? 'bl-more' : 'bl-group-text', n));
  });

  const track = el('div', 'bl-track');
  cards.forEach((nodes, i) => {
    const slide = el('div', 'bl-slide', storyCard(nodes));
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-label', `${i + 1} of ${cards.length}`);
    track.append(slide);
  });
  const carousel = el('div', 'bl-carousel', track);
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', `${title ? title.textContent.trim() : 'Blog'} stories`);

  block.classList.add('za-container');
  block.replaceChildren(head, carousel, arrows(track));
}
