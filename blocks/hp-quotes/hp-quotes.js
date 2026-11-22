/**
 * hp-quotes — testimonial carousel (slick-style: one slide in view, infinite clones).
 *
 * Authoring: the section head (<h2>, <p>) is default content before the block (reabsorbed,
 * EW8; a leading heading row without image is the fallback). One row per testimonial:
 *   logo image | stats: <p> figure, <p> caption pairs (up to 3) | quote: <p> quote, <p> name,
 *   <p> role, <p><a> story link | photo image
 * Empty image cells are allowed. The authored stats sit on the photo (>= 768); the first two
 * are repeated under the logo for small screens as presentational copies (EW4).
 */

const PREV_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="m5.052 12.85 3.549 3.55-1.202 1.202L1.798 12l5.601-5.602 1.202 1.203-3.549 3.549H21v1.7z"></path></svg>';
const NEXT_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg>';

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

function stripInstrumentation(node) {
  node.querySelectorAll('[data-prose-index], [data-image-index], [id]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
    n.removeAttribute('id');
  });
  node.removeAttribute('data-prose-index');
  node.removeAttribute('id');
  return node;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isFigure = (n) => /^[<>~≈+-]?\s*\d[\d.,–-]*\s*[%+xKMB]?$/i.test(n.textContent.trim());

function takeHead(block, rows) {
  const wrap = block.parentElement && block.parentElement.previousElementSibling;
  if (wrap && wrap.classList.contains('default-content-wrapper')) {
    const nodes = [...wrap.children];
    wrap.remove();
    return nodes;
  }
  const nodes = [];
  while (rows.length && rows[0].querySelector('h1, h2') && !rows[0].querySelector('picture, img')) {
    rows.shift().querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

/** wrap % / < / > of a figure in .hp-stat-char (splits the text node; text unchanged) */
function markChars(p) {
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => {
    const parts = t.textContent.split(/([%<>])/);
    if (parts.length < 2) return;
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      if (!part) return;
      if (/^[%<>]$/.test(part)) frag.append(el('span', 'hp-stat-char', part));
      else frag.append(part);
    });
    t.replaceWith(frag);
  });
}

function statGroups(nodes) {
  const groups = [];
  nodes.forEach((n) => {
    if (isFigure(n)) {
      markChars(n);
      groups.push(el('div', 'hp-tstat', el('div', 'hp-tstat-fig', n)));
    } else if (groups.length) {
      groups[groups.length - 1].append(el('div', 'hp-tstat-head', n));
    } else {
      groups.push(el('div', 'hp-tstat', el('div', 'hp-tstat-head', n)));
    }
  });
  return groups;
}

function cellNodes(cell) {
  return cell ? [...cell.children] : [];
}

function buildSlide(row, i) {
  const cells = [...row.children];
  const all = cells.flatMap(cellNodes);
  const mediaCells = cells.filter((c) => c.querySelector('picture, img'));
  // positional when the 4-cell shape is authored, else by content
  let logoCell = cells.length >= 4 ? cells[0] : null;
  let photoCell = cells.length >= 4 ? cells[3] : null;
  if (!logoCell && mediaCells.length) [logoCell] = mediaCells;
  if (!photoCell && mediaCells.length > 1) photoCell = mediaCells[mediaCells.length - 1];
  const textNodes = all.filter((n) => !mediaOf(n));
  const statNodes = [];
  const quoteNodes = [];
  textNodes.forEach((n) => {
    const inStatCell = cells.length >= 4 && cells[1].contains(n);
    const looseStat = cells.length < 4 && !quoteNodes.length
      && (isFigure(n) || statNodes.length % 2 === 1);
    if (inStatCell || looseStat) {
      statNodes.push(n);
    } else quoteNodes.push(n);
  });

  const slide = el('div', `hp-quote${i === 0 ? ' is-active' : ''}`);
  slide.dataset.index = String(i);
  const copy = el('div', 'hp-quote-copy');
  const logoMedia = logoCell ? logoCell.querySelector('picture, img') : null;
  copy.append(el('div', 'hp-quote-logo', logoMedia ? (logoMedia.closest('p') || logoMedia.closest('picture') || logoMedia) : null));
  const groups = statGroups(statNodes);
  const mstats = el('div', 'hp-quote-mstats');
  mstats.setAttribute('aria-hidden', 'true');
  groups.slice(0, 2).forEach((g) => mstats.append(stripInstrumentation(g.cloneNode(true))));
  copy.append(mstats);

  const link = quoteNodes.find((n) => n.querySelector('a'));
  const rest = quoteNodes.filter((n) => n !== link);
  const [quote, ...who] = rest;
  const inner = el('div', 'hp-quote-inner');
  if (quote) inner.append(el('blockquote', 'hp-quote-text', quote));
  const cite = el('div', 'hp-quote-cite');
  if (who.length) {
    const [name, ...role] = who;
    cite.append(el('div', 'hp-quote-who', el(
      'div',
      '',
      el('div', 'hp-quote-name', name),
      role.length ? el('div', 'hp-quote-role', ...role) : null,
    )));
  }
  if (link) cite.append(el('div', 'hp-quote-link', link));
  inner.append(cite);
  copy.append(el('div', 'hp-quote-body', inner));

  const media = el('div', 'hp-quote-media');
  const photo = photoCell && photoCell !== logoCell ? photoCell.querySelector('picture, img') : null;
  media.append(el('div', 'hp-quote-img', photo ? (photo.closest('p') || photo.closest('picture') || photo) : null));
  media.append(el('div', 'hp-quote-ostats', ...groups));
  slide.append(copy, media);
  return slide;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headNodes = takeHead(block, rows);
  block.classList.add('za-section');
  const container = el('div', 'za-container za-row-gap');
  if (headNodes.length) {
    const heading = headNodes.find(isHeading);
    const prose = headNodes.filter((n) => n !== heading);
    const col = el('div', 'za-col hp-center-col');
    if (heading) col.append(el('div', 'hp-head-title', heading));
    if (prose.length) col.append(el('div', 'za-text', ...prose));
    container.append(el('div', 'za-row hp-center-row', col));
  }

  const slides = rows.filter((r) => r.textContent.trim() || r.querySelector('picture, img')).map(buildSlide);
  const track = el('div', 'hp-quotes-track', ...slides);
  const viewport = el('div', 'hp-quotes-viewport', track);
  const card = el('div', 'hp-quotes-card', viewport);
  const n = slides.length;

  if (n > 1) {
    const clone = (s) => {
      const c = stripInstrumentation(s.cloneNode(true));
      c.classList.remove('is-active');
      c.classList.add('hp-quote-clone');
      c.setAttribute('aria-hidden', 'true');
      c.inert = true;
      delete c.dataset.index;
      return c;
    };
    track.prepend(clone(slides[n - 1]));
    slides.forEach((s) => track.append(clone(s)));

    const nav = el('div', 'hp-quotes-nav');
    const prev = el('button', 'hp-roundbtn');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous testimonial');
    prev.innerHTML = PREV_SVG;
    const next = el('button', 'hp-roundbtn');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next testimonial');
    next.innerHTML = NEXT_SVG;
    nav.append(prev);
    const dots = slides.map((s, k) => {
      const d = el('button', `hp-dot${k === 0 ? ' is-active' : ''}`);
      d.type = 'button';
      d.setAttribute('aria-label', `Testimonial ${k + 1}`);
      nav.append(d);
      return d;
    });
    nav.append(next);
    const live = el('div', 'za-sr');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    card.append(nav, live);

    let cur = 0;
    const pos = (i, animate) => {
      track.classList.toggle('is-moving', !!animate);
      track.style.setProperty('--qi', String(i + 1));
    };
    const mark = () => {
      slides.forEach((s, k) => {
        const on = k === cur;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
        s.inert = !on;
      });
      dots.forEach((d, k) => d.classList.toggle('is-active', k === cur));
      live.textContent = `Slide ${cur + 1} of ${n}`;
    };
    const go = (i) => {
      const target = i; // -1 or n land on a clone, then jump back without animation
      cur = (i + n) % n;
      mark();
      pos(target, true);
      const done = () => {
        track.removeEventListener('transitionend', done);
        if (target !== cur) pos(cur, false);
        else track.classList.remove('is-moving');
      };
      track.addEventListener('transitionend', done);
    };
    slides.forEach((s, k) => {
      if (k) {
        s.setAttribute('aria-hidden', 'true');
        s.inert = true;
      }
    });
    pos(0, false);
    prev.addEventListener('click', () => go(cur - 1));
    next.addEventListener('click', () => go(cur + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
  }

  container.append(el('div', 'za-row hp-quotes-row', el('div', 'za-col hp-quotes-col', card)));
  block.replaceChildren(container);
}
