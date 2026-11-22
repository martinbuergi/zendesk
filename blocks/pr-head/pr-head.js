/**
 * pr-head — pricing page head: "View pricing for:" product tabs (live TabNavigation) and the
 * page title. Schema: stardust/eds-schema/pricing.json sections 1-2 (.pr-tabs, .pr-title).
 *
 * Authoring (one cell): label <p>, <ul> of tab links (the tab whose path is the current page
 *   renders active), <h1> (an <em> run renders in the matcha accent colour).
 * @ew-exempt aria-label "Previous tab" / "Next tab" — runtime scroll controls
 */

const ARROW_L = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M10.39 3.312a.5.5 0 00-.718-.69l-.062.066-4 5a.5.5 0 00-.054.542l.054.082 4 5a.5.5 0 00.83-.55l-.05-.074L6.641 8l3.749-4.688z"></path></svg>';
const ARROW_R = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M5.61 3.312a.5.5 0 01.718-.69l.062.066 4 5a.5.5 0 01.054.542l-.054.082-4 5a.5.5 0 01-.83-.55l.05-.074L9.359 8 5.61 3.312z"></path></svg>';

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

const norm = (p) => (p.endsWith('/') ? p : `${p}/`);

export default function decorate(block) {
  if (block.querySelector(':scope > .pr-head-tabs')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const list = nodes.find((n) => n.tagName === 'UL' || n.tagName === 'OL');
  const rest = nodes.filter((n) => n !== heading && n !== list);

  const row = el('div', 'pr-head-row');
  rest.forEach((n) => row.append(wrapNode(n, 'pr-head-label')));
  if (list) {
    const here = norm(window.location.pathname);
    list.querySelectorAll('a[href]').forEach((a) => {
      let path = '';
      try { path = norm(new URL(a.href, window.location.href).pathname); } catch { /* keep */ }
      if (path === here) a.setAttribute('aria-current', 'page');
    });
    const nav = el('nav', 'pr-head-nav');
    nav.setAttribute('aria-label', 'Tab navigation');
    const scroll = el('div', 'pr-head-scroll');
    scroll.append(list);
    const prev = el('button', 'pr-head-more pr-head-prev');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous tab');
    prev.innerHTML = ARROW_L;
    prev.hidden = true;
    const next = el('button', 'pr-head-more pr-head-next');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next tab');
    next.innerHTML = ARROW_R;
    const sync = () => {
      const max = scroll.scrollWidth - scroll.clientWidth;
      prev.hidden = scroll.scrollLeft <= 1;
      next.hidden = max > 1 && scroll.scrollLeft >= max - 1;
    };
    const step = (dir) => scroll.scrollBy({ left: dir * scroll.clientWidth * 0.6, behavior: 'smooth' });
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    scroll.addEventListener('scroll', sync, { passive: true });
    nav.append(scroll, prev, next);
    row.append(nav);
  }
  const tabs = el('div', 'za-container pr-head-tabs');
  tabs.append(row);
  const title = el('div', 'za-container pr-head-title');
  if (heading) title.append(wrapNode(heading, 'pr-head-h'));
  block.replaceChildren(tabs, title);
}
