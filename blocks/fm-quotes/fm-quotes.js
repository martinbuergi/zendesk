/**
 * fm-quotes — form-template customer-stories carousel (live /free-trial/ #testimonials: slick,
 * one slide in view — portrait beside the quote — round prev/next arrows, customer-logo tabs
 * under the slide; below 768 px the active logo sits above the slide and dots join the arrows).
 *
 * Section head: default content before the block (the eyebrow <p>) is reabsorbed (EW8).
 * Authoring: one row per story — cell 1: the portrait <picture> (may be empty); cell 2: the
 *   customer logo <picture> (alt = customer name), the quote (<blockquote> or the first text
 *   <p>), the name <p>, the role <p>, the story link <p><a>.
 * Slick clones (one before, one per slide after) are presentational copies (EW4).
 * @ew-exempt aria-label "Previous" / "Next" / "Customer story n" — runtime carousel controls
 */

const ARROW = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"',
  ' aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.3 5.3a1 1 0 0 1 1.4 0',
  'l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4l4.3-4.3H4a1 1 0 1 1 0-2h13.6l-4.3-4.3a1 1 0 0 1',
  ' 0-1.4"/></svg>',
].join('');

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

const isMedia = (n) => n.matches('picture, img')
  || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isLink = (n) => !!n.querySelector('a')
  && n.textContent.trim() === n.querySelector('a').textContent.trim();

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const head = el('div', 'fm-quotes-head');
  [...wrapper.children].forEach((n) => head.append(wrapNode(n, 'za-eyebrow')));
  wrapper.remove();
  return head;
}

function buildSlide(row) {
  const cells = [...row.children];
  const photoNodes = cells.length > 1 ? [...cells[0].children] : [];
  const nodes = (cells.length > 1 ? cells.slice(1) : cells).flatMap((c) => [...c.children]);
  const logo = nodes.find(isMedia);
  const slide = el('div', 'fm-quotes-slide');
  const photo = el('div', 'fm-quotes-photo');
  photoNodes.forEach((n) => photo.append(n));
  const body = el('div', 'fm-quotes-body');
  const rest = nodes.filter((n) => n !== logo);
  const quote = rest.find((n) => n.tagName === 'BLOCKQUOTE')
    || rest.find((n) => n.tagName === 'P' && !isLink(n));
  if (quote) body.append(wrapNode(quote, 'fm-quotes-quote'));
  const cite = el('div', 'fm-quotes-cite');
  const who = el('div', 'fm-quotes-who');
  const links = el('div', 'fm-quotes-link');
  rest.forEach((n) => {
    if (n === quote) return;
    if (isLink(n)) links.append(n);
    else who.append(wrapNode(n, who.children.length ? 'fm-quotes-role' : 'fm-quotes-name'));
  });
  cite.append(who);
  if (links.children.length) cite.append(links);
  body.append(cite);
  if (photo.children.length) slide.append(photo);
  else slide.classList.add('fm-quotes-nophoto');
  slide.append(body);
  return { slide, logo };
}

function stripInstrumentation(node) {
  [node, ...node.querySelectorAll('[data-prose-index], [data-image-index]')].forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  return node;
}

function cloneSlide(slide) {
  const c = stripInstrumentation(slide.cloneNode(true));
  c.classList.add('fm-quotes-clone');
  c.setAttribute('aria-hidden', 'true');
  c.querySelectorAll('a').forEach((a) => { a.tabIndex = -1; });
  return c;
}

function arrow(dir, label) {
  const b = el('button', `fm-quotes-arrow fm-quotes-${dir}`);
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.innerHTML = ARROW;
  return b;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const rows = [...block.children].filter((r) => r.textContent.trim() || r.querySelector('img'));
  const built = rows.map(buildSlide);

  const stage = el('div', 'fm-quotes-stage');
  const track = el('div', 'fm-quotes-track');
  built.forEach((b) => track.append(b.slide));
  // slick infinite mode (live): one presentational clone before, a clone of every slide after
  const offset = built.length > 1 ? 1 : 0;
  if (offset) {
    track.prepend(cloneSlide(built[built.length - 1].slide));
    built.forEach((b) => track.append(cloneSlide(b.slide)));
  }
  const viewport = el('div', 'fm-quotes-viewport');
  viewport.append(track);
  const prev = arrow('prev', 'Previous');
  const next = arrow('next', 'Next');
  stage.append(prev, viewport, next);

  const tabs = el('div', 'fm-quotes-tabs');
  tabs.setAttribute('role', 'tablist');
  const dots = el('div', 'fm-quotes-dots');
  const mprev = arrow('prev', 'Previous');
  const mnext = arrow('next', 'Next');
  dots.append(mprev);
  const dotEls = built.map((b, i) => {
    const t = el('div', 'fm-quotes-tab');
    t.setAttribute('role', 'tab');
    t.tabIndex = 0;
    if (b.logo) t.append(b.logo);
    t.dataset.index = String(i);
    tabs.append(t);
    const d = el('button', 'fm-quotes-dot');
    d.type = 'button';
    d.setAttribute('aria-label', `Customer story ${i + 1}`);
    d.dataset.index = String(i);
    dots.append(d);
    return { t, d };
  });
  dots.append(mnext);

  let cur = 0;
  const show = (i) => {
    cur = (i + built.length) % built.length;
    track.style.transform = `translateX(${-100 * (cur + offset)}%)`;
    built.forEach((b, j) => {
      b.slide.classList.toggle('is-active', j === cur);
    });
    dotEls.forEach(({ t, d }, j) => {
      t.classList.toggle('is-active', j === cur);
      t.setAttribute('aria-selected', j === cur ? 'true' : 'false');
      d.classList.toggle('is-active', j === cur);
    });
  };
  [prev, mprev].forEach((b) => b.addEventListener('click', () => show(cur - 1)));
  [next, mnext].forEach((b) => b.addEventListener('click', () => show(cur + 1)));
  dotEls.forEach(({ t, d }, j) => {
    t.addEventListener('click', () => show(j));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(j);
      }
    });
    d.addEventListener('click', () => show(j));
  });
  show(0);

  const container = el('div', 'za-container');
  if (head) container.append(head);
  container.append(stage, tabs, dots);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
