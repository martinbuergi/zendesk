/**
 * bl-latest — "Latest stories": title, a 2/3/4-column story grid, then the pagination list.
 *
 * Authoring:
 *   title       <h2>Latest stories</h2>                         (the first row without an image)
 *   card        image | <h3><a href>title</a></h3> <p>description (optional)</p> <p><a>tag</a>…</p>
 *     (optional)
 *   pagination
 *     <ul><li>1</li><li><a>2</a></li>…<li>…</li><li><a>233</a></li><li><a>Next</a></li></ul>
 *               the item without a link is the current page; numbered links after it up to the last
 *               number hide below 768; a non-numeric link is the Next link.
 *
 * Variants (listing hubs and directories): `filters` (directory grid beside a bl-filters aside),
 * `no-title`, `legacy` (gen-B type). Their cards are listing tiles (see bl-group):
 *   head   rows before the first tile: <h2>title or result count</h2> <h5>Sort by</h5> <p>value</p>
 *          <ul> prev/next links
 *   tile   one cell in source order: images, <p>eyebrow</p>, <h3|h4> title (link = tile link),
 *          <p> lines, <p>:bl-rating-N:</p>, <p><a>CTA</a></p>
 *   tail   rows after the tiles: <p>count</p> <p>Load more</p> <p><img></p> <ul> pagination
 */

// eslint-disable-next-line max-len
const NEXT_ICON = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M9.804 11.373c.501-1.024 1.408-2.069 2.379-2.656v-.555c-.981-.608-1.909-1.835-2.251-2.688l-1.013.587c.32.704.928 1.376 1.483 1.813h-6.24v1.109h6.229c-.565.395-1.163 1.067-1.525 1.739l.939.651z"></path></svg>';

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

function pagination(list) {
  const items = [...list.children];
  const numeric = items.filter((li) => /^\d+$/.test(li.textContent.trim()));
  const last = numeric[numeric.length - 1];
  items.forEach((li) => {
    const a = li.querySelector('a');
    const label = li.textContent.trim();
    if (/^\d+$/.test(label)) {
      li.title = label;
      li.setAttribute('aria-label', `Page ${label}`);
      li.setAttribute('aria-current', a ? 'false' : 'true');
      if (!a) {
        // current page: the source renders it as an inert self-link (moved text node, EW1)
        const self = el('a', 'bl-page-num', ...li.childNodes);
        self.href = '#';
        self.setAttribute('aria-current', 'page');
        self.addEventListener('click', (e) => e.preventDefault());
        li.append(self);
      } else if (li !== last) li.classList.add('hide-sm-down');
    } else if (a && /^prev/i.test(label)) {
      li.setAttribute('aria-label', 'Previous page');
      li.classList.add('bl-page-prev');
    } else if (a) {
      li.setAttribute('aria-label', 'Next page');
      li.classList.add('bl-page-next');
      if (!a.querySelector('.bl-page-next-text')) {
        const icon = el('span', 'bl-page-next-icon');
        icon.innerHTML = NEXT_ICON;
        a.append(el('span', 'bl-page-next-text', ...a.childNodes), icon);
      }
    }
  });
  return el('div', 'bl-pages', list);
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
  const head = [];
  const tiles = [];
  const tail = [];
  rows.forEach((nodes) => {
    if (nodes.some(mediaOf) && nodes.some(isHeading)) tiles.push(nodes);
    else (tiles.length ? tail : head).push(...nodes);
  });
  const container = el('div', 'za-container');
  if (head.length) {
    const bar = el('div', 'bl-latest-head');
    let sort = null;
    head.forEach((n) => {
      if (n.matches('ul, ol')) bar.append(pagination(n));
      else if (n.matches('h5, h6')) {
        sort = el('div', 'bl-sort', n);
        bar.append(sort);
      } else if (sort && n.tagName === 'P') sort.append(el('div', 'bl-sort-value', n));
      else bar.append(el('div', isHeading(n) ? 'bl-latest-title' : 'bl-latest-text', n));
    });
    container.append(bar);
  }
  const asCard = !block.classList.contains('legacy');
  container.append(el('div', 'bl-tiles', ...tiles.map((nodes) => tile(nodes, asCard))));
  tail.forEach((n) => {
    if (n.matches('ul, ol')) container.append(pagination(n));
    else if (mediaOf(n)) container.append(el('div', 'bl-latest-logo', n));
    else if (n.tagName === 'P' && !n.querySelector('a') && n.textContent.trim().split(/\s+/).length <= 3) {
      // the source's load-more button: authored label, styled as the button (static listing, D3)
      container.append(el('div', 'bl-load', n));
    } else container.append(el('div', 'bl-latest-count', n));
  });
  block.classList.add('za-section');
  block.replaceChildren(container);
}

export default function decorate(block) {
  if (['filters', 'no-title', 'legacy'].some((v) => block.classList.contains(v))) {
    decorateVariant(block);
    return;
  }
  const rows = [...block.children].map(rowNodes).filter((r) => r.length);
  const head = [];
  const cards = [];
  const tail = [];
  rows.forEach((nodes) => {
    if (nodes.some(mediaOf)) cards.push(nodes);
    else if (!cards.length) head.push(...nodes);
    else tail.push(...nodes);
  });
  const title = head.find(isHeading);
  const container = el('div', 'za-container');
  if (title) container.append(el('div', 'bl-latest-title', title));
  head.filter((n) => n !== title).forEach((n) => container.append(n));
  container.append(el('div', 'bl-latest-grid', ...cards.map(storyCard)));
  tail.forEach((n) => container.append(n.matches('ul, ol') ? pagination(n) : n));
  block.classList.add('za-section');
  block.replaceChildren(container);
}
