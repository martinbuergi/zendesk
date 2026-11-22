/**
 * sv-stories — customer-stories carousel (live #quoteCarouselWrapper): one slide per
 * customer with logo + stats aside and a quote, autoplay every 10 s while in view
 * with a progress bar on the active logo tab, arrows, dots (< 768) and logo tabs (>= 768).
 * Schema: stardust/eds-schema/service.json section 3 (#testimonials).
 *
 * Section head: default content before the block (eyebrow <p>, optional <h2>) is
 * reabsorbed into the centered head row (EW8). Section Metadata style `cream` paints the band.
 * Authoring: one row per slide —
 *   cell 1: logo <picture> (alt = customer name), then stats: each stat is a figure
 *     <p><strong>80%</strong></p> followed by its label <p>;
 *   cell 2: the quote (<blockquote> or the first <p>), the person's name <p>, their
 *     role <p>, and the story link <p><a>.
 * @ew-exempt aria-label "<name> testimonial" / "Testimonial n" — runtime carousel controls
 */

const ARROW_L = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="m5.052 12.85 3.549 3.55-1.202 1.202L1.798 12l5.601-5.602 1.202 1.203-3.549 3.549H21v1.7z"></path></svg>';
const ARROW_R = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg>';
const AUTOPLAY_MS = 10000;

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

function stripInstrumentation(node) {
  node.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  node.removeAttribute('data-prose-index');
  node.removeAttribute('data-image-index');
  return node;
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

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isLink = (n) => !!n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

// figure text: digits stay full size, unit characters ($, %, K+) take the smaller .sv-stat-ch
function splitFigure(host) {
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => {
    const parts = t.textContent.split(/([^\d.,\-–\s]+)/).filter((s) => s !== '');
    if (parts.length < 2 && !/[^\d.,\-–\s]/.test(t.textContent)) return;
    const frag = document.createDocumentFragment();
    parts.forEach((s) => {
      if (/[^\d.,\-–\s]/.test(s)) {
        const span = el('span', 'sv-stat-ch');
        span.textContent = s;
        frag.append(span);
      } else frag.append(document.createTextNode(s));
    });
    t.replaceWith(frag);
  });
}

function buildSlide(row) {
  const cells = [...row.children];
  // a third cell is the story's photo (single-story variant)
  const photo = cells.length > 2 ? [...cells[2].children] : [];
  const nodes = cells.slice(0, 2).flatMap((c) => [...c.children]);
  const logo = nodes.find(isMedia);
  const aside = el('div', 'sv-story-aside');
  const body = el('div', 'sv-story-body');
  const logoBox = el('div', 'sv-story-logo');
  if (logo) logoBox.append(logo);
  aside.append(logoBox);
  const stats = el('div', 'sv-story-stats');
  let stat = null;
  const rest = [];
  nodes.forEach((n) => {
    if (n === logo) return;
    const lead = n.tagName === 'P' && n.firstElementChild && n.firstElementChild.tagName === 'STRONG'
      && n.textContent.trim() === n.firstElementChild.textContent.trim();
    if (lead && !n.querySelector('a') && rest.length === 0) {
      stat = el('div', 'sv-stat');
      splitFigure(n.firstElementChild);
      stat.append(wrapNode(n, 'sv-stat-fig'));
      stats.append(stat);
    } else if (stat && rest.length === 0 && n.tagName === 'P' && !n.querySelector('a') && !stat.querySelector('.sv-stat-head')) {
      stat.append(wrapNode(n, 'sv-stat-head'));
    } else rest.push(n);
  });
  if (stats.children.length) aside.append(stats);

  const q = el('div', 'sv-story-q');
  const qi = el('div');
  const quote = rest.find((n) => n.tagName === 'BLOCKQUOTE') || rest.find((n) => n.tagName === 'P' && !isLink(n));
  const cite = el('div', 'sv-story-cite');
  const who = el('div', 'sv-story-who');
  const whoInner = el('div');
  const links = el('div', 'sv-story-link');
  const qPos = rest.indexOf(quote);
  const titles = quote && quote.tagName === 'BLOCKQUOTE' ? rest.slice(0, qPos).filter((n) => !isLink(n)) : [];
  titles.forEach((n) => qi.append(wrapNode(n, 'sv-story-title')));
  rest.forEach((n) => {
    if (n === quote || titles.includes(n)) return;
    if (isLink(n)) {
      n.querySelectorAll('a').forEach((a) => { if (a.title === a.textContent) a.removeAttribute('title'); });
      links.append(n);
    } else whoInner.append(wrapNode(n, whoInner.children.length ? 'sv-story-role' : 'sv-story-name'));
  });
  if (quote) qi.append(wrapNode(quote, 'sv-story-quote'));
  who.append(whoInner);
  cite.append(who);
  if (links.children.length) cite.append(links);
  qi.append(cite);
  q.append(qi);
  body.append(q);

  const story = el('div', 'sv-story');
  story.append(aside, body);
  if (photo.length) {
    const ph = el('div', 'sv-story-photo');
    photo.forEach((n) => ph.append(n));
    story.append(ph);
  }
  const slide = el('div', 'sv-quotes-slide');
  slide.append(story);
  return { slide, logo };
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  let rows = [...block.children].filter((r) => r.textContent.trim() || r.querySelector('img'));
  // foot row: one cell without a quote (legacy "Trusted by" heading + badges) → under the carousel
  const foot = el('div', 'sv-quotes-foot');
  rows = rows.filter((r) => {
    if (r.children.length !== 1 || r.querySelector('blockquote') || rows.length < 2) return true;
    [...r.firstElementChild.children].forEach((n) => foot.append(n));
    return false;
  });
  const built = rows.map(buildSlide);

  const wrap = el('div', 'za-col sv-quotes');
  const prev = el('button', 'sv-round sv-quotes-arrow', `<span>${ARROW_L}</span>`);
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous testimonial');
  prev.dataset.dir = '-1';
  const next = el('button', 'sv-round sv-quotes-arrow', `<span>${ARROW_R}</span>`);
  next.type = 'button';
  next.setAttribute('aria-label', 'Next testimonial');
  next.dataset.dir = '1';
  const stage = el('div', 'sv-quotes-stage');
  const track = el('div', 'sv-quotes-track');
  built.forEach((b, i) => {
    b.slide.dataset.index = String(i);
    track.append(b.slide);
  });
  stage.append(track);

  const navs = el('div', 'sv-quotes-navs');
  const dotsNav = el('nav', 'sv-quotes-dots');
  dotsNav.setAttribute('aria-label', 'Testimonials');
  const dprev = prev.cloneNode(true);
  const dnext = next.cloneNode(true);
  dprev.classList.remove('sv-quotes-arrow');
  dnext.classList.remove('sv-quotes-arrow');
  dotsNav.append(dprev);
  const dots = built.map((b, i) => {
    const d = el('button', 'sv-dot');
    d.type = 'button';
    d.setAttribute('aria-label', `Testimonial ${i + 1}`);
    d.dataset.index = String(i);
    dotsNav.append(d);
    return d;
  });
  dotsNav.append(dnext);
  const logosNav = el('nav', 'sv-quotes-logos');
  logosNav.setAttribute('aria-label', 'Customers');
  const tabs = built.map((b, i) => {
    const t = el('button', 'sv-logo-tab');
    t.type = 'button';
    t.dataset.index = String(i);
    const span = el('span');
    const img = b.logo && (b.logo.matches('img') ? b.logo : b.logo.querySelector('img'));
    if (img) {
      const clone = stripInstrumentation(img.cloneNode(true));
      clone.loading = 'lazy';
      span.append(clone);
      const name = (img.alt || '').replace(/\s+logo$/i, '').trim();
      if (name) t.setAttribute('aria-label', `${name} testimonial`);
    }
    t.append(span);
    logosNav.append(t);
    return t;
  });
  navs.append(dotsNav, logosNav);
  wrap.append(prev, stage, next, navs);

  // behaviour: slide travel (translateX), autoplay 10 s while in view with the tab progress bar
  let cur = 0;
  let timer = null;
  const slides = built.map((b) => b.slide);
  const schedule = () => {
    clearTimeout(timer);
    if (!wrap.classList.contains('is-playing') || slides.length < 2) return;
    // eslint-disable-next-line no-use-before-define
    timer = setTimeout(() => show(cur + 1), AUTOPLAY_MS);
  };
  const show = (n) => {
    if (!slides.length) return;
    cur = (n + slides.length) % slides.length;
    track.style.transform = `translateX(${-100 * cur}%)`;
    slides.forEach((s, j) => {
      s.classList.toggle('is-active', j === cur);
      s.setAttribute('aria-hidden', String(j !== cur));
      if (j === cur) s.removeAttribute('inert'); else s.setAttribute('inert', '');
    });
    dots.forEach((d, j) => d.classList.toggle('is-active', j === cur));
    tabs.forEach((t, j) => {
      t.classList.toggle('is-active', j === cur);
      t.setAttribute('aria-current', String(j === cur));
    });
    schedule();
  };
  [prev, next, dprev, dnext].forEach((b) => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));
  [...dots, ...tabs].forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.index))));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        wrap.classList.toggle('is-playing', e.isIntersecting);
        if (e.isIntersecting) schedule(); else clearTimeout(timer);
      });
    }, { threshold: 0.5 }).observe(wrap);
  }
  show(0);

  const row = el('div', 'za-row sv-quotes-row');
  row.append(wrap);
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(row);
  if (foot.children.length) container.append(foot);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
