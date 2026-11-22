/**
 * bl-subnav — the blog microsite sub-navigation: a sticky bar under the (non-sticky) global header.
 * Desktop (>= 1150): brand + category links with hover/focus dropdowns. Below 1150: back, brand,
 * menu toggle; the same authored list opens as a panel under the bar.
 *
 * Authoring (rows, any cell split):
 *   brand link  <p><a href="/blog/"><em>Zendesk</em> Blog</a></p>
 *   categories  <ul><li><a>Category</a><ul><li><a>Sub-category</a></li>…</ul></li>…</ul>
 *
 * Also owns two page-level behaviours of the listing template: sections gain `active` when they
 * enter the viewport, and the bar takes `is-stuck` while it is pinned.
 */

const SVG = {
  // eslint-disable-next-line max-len
  back: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="m14.782 19.352-7.367-7.366 7.339-7.339 1.202 1.203-6.137 6.136 6.165 6.164z" clip-rule="evenodd"></path></svg>',
  // eslint-disable-next-line max-len
  menu: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 32 32"><path fill="currentColor" fill-rule="evenodd" d="M25 11H7V9h18zm0 6H7v-2h18zM7 23h18v-2H7z" clip-rule="evenodd"></path></svg>',
};

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

function button(className, label, svg) {
  const b = el('button', className);
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.innerHTML = svg;
  return b;
}

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => out.push(...cell.children));
  return out;
}

function observeSections() {
  const sections = document.querySelectorAll('main > .section');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        io.unobserve(e.target);
      }
    });
  });
  sections.forEach((s) => io.observe(s));
}

function stickyState(bar) {
  const tick = () => {
    const top = parseFloat(getComputedStyle(bar).top) || 0;
    bar.classList.toggle('is-stuck', window.scrollY > 0 && bar.getBoundingClientRect().top <= top + 0.5);
  };
  window.addEventListener('scroll', tick, { passive: true });
  tick();
}

export default function decorate(block) {
  const nodes = collectNodes(block);
  const list = nodes.find((n) => n.matches('ul, ol'));
  const brandP = nodes.find((n) => n !== list && (n.matches('a') || n.querySelector('a')));
  const leftovers = nodes.filter((n) => n !== list && n !== brandP);

  const bar = el('div', 'bl-subnav-bar');
  const back = button('bl-subnav-back', 'Back', SVG.back);
  back.tabIndex = -1;
  back.addEventListener('click', () => window.history.back());
  bar.append(back, el('div', 'bl-subnav-brand', brandP, ...leftovers));

  const menus = el('div', 'bl-subnav-menus');
  if (list) {
    menus.id = 'bl-subnav-menu';
    menus.append(el('div', 'bl-subnav-list', list));
    list.setAttribute('aria-label', 'Blog categories');
  }
  bar.append(menus);

  const toggle = button('bl-subnav-toggle', 'Toggle Mobile Menu', SVG.menu);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'bl-subnav-menu');
  toggle.addEventListener('click', () => {
    const open = !block.classList.contains('is-open');
    block.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  bar.append(el('div', 'bl-subnav-end', toggle));

  block.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && block.classList.contains('is-open')) {
      block.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  const nav = el('nav', 'bl-subnav-nav', bar);
  nav.setAttribute('aria-label', 'Blog navigation');
  block.replaceChildren(nav);
  stickyState(block);
  observeSections();
}
