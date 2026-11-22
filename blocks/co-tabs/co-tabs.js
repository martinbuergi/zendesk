/**
 * co-tabs — in-page section navigation with a sticky sidebar (live trust-center Sidebar: four
 * icon links 4/12 beside the content column 7/12; hidden below 768 px, the content stays).
 *
 * Authoring: one row per tab — cell 1: an icon token (:co-lock:); cell 2: ONE link paragraph to
 *   the heading that starts the tab group (<p><a href="#legal">Legal</a></p>).
 * The block adopts the sections that follow it while they hold a co-accordion block (the tab
 * groups) and lays them out in the content column; the active link follows the scroll position.
 * @ew-exempt icon token (cell 1) — glyph key, never displayed as text
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function adoptSections(block) {
  const section = block.closest('.section');
  const out = [];
  let next = section && section.nextElementSibling;
  while (next && next.classList.contains('section') && next.querySelector('.co-accordion')) {
    const after = next.nextElementSibling;
    out.push(next);
    next = after;
  }
  return out;
}

function spy(tabs) {
  const targets = tabs.map(({ a }) => {
    const id = decodeURIComponent((a.getAttribute('href') || '').replace(/^#/, ''));
    return id ? document.getElementById(id) : null;
  });
  const update = () => {
    let active = 0;
    targets.forEach((t, i) => {
      if (t && t.getBoundingClientRect().top <= 160) active = i;
    });
    tabs.forEach(({ tab }, i) => tab.classList.toggle('is-active', i === active));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const nav = el('nav', 'co-tabs-nav');
  nav.setAttribute('aria-label', 'On this page');
  const tabs = [];
  [...block.children].forEach((row) => {
    const icon = row.querySelector('.icon');
    const p = [...row.querySelectorAll('p')].find((x) => x.querySelector('a[href]'));
    if (!p) return;
    const a = p.querySelector('a[href]');
    const tab = el('div', 'co-tab');
    if (icon) {
      const box = el('span', 'co-tab-icon');
      box.append(icon);
      a.prepend(box);
    }
    tab.append(p);
    nav.append(tab);
    tabs.push({ tab, a });
  });
  if (tabs.length) tabs[0].tab.classList.add('is-active');

  const side = el('div', 'za-col co-tabs-side');
  side.append(nav);
  const main = el('div', 'za-col co-tabs-main');
  main.append(...adoptSections(block));
  const row = el('div', 'za-row');
  row.append(side, main);
  const container = el('div', 'za-container');
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(container);
  // ids exist once the adopted sections are in the DOM (headings carry their pipeline ids)
  spy(tabs);
}
