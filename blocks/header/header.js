import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  loadIcons, icon, authoredIconNames, inlineIcons, el, stripInstrumentation, chromeSections,
  markExternal, wrapLinkText, itemLabelNodes, menuItemParts, linkContainsPage,
} from '../../scripts/chrome.js';

/*
 * Header: the authored /nav fragment slotted into the zendesk.com chrome templates.
 *
 * Generation A (default /nav, /nav-slim, /nav-pricing): promo strip, mobile bar + drawer
 * (< 970px), desktop secondary row + primary row with hover/focus mega menus (>= 970px).
 * Generation B (/nav-legacy, theme legacy): legacy two-row header, hover dropdowns, mobile
 * accordion drawer, sticky once scrolled past the secondary row.
 *
 * /nav sections are identified by their Section Metadata style:
 *   promo | brand | utility | menu | menu-feature | tools | mobile-bar | drawer
 * Page metadata `promo: off` drops the promo strip (styles.css reserves the matching height);
 * `promo: /<doc>` swaps in that document's promo section (per-page campaign strip, both
 * generations); `language: off` drops the utility language picker; `nav: none` (or a path
 * ending in /nav-none) renders no global header.
 */

const DESKTOP = window.matchMedia('(width >= 970px)');
const UI_ICONS = [
  'za-logo', 'za-close', 'za-menu', 'za-chevron-down', 'za-external', 'za-wordmark',
  'zb-menu', 'zb-chevron',
];

function sectionsBy(sections, style) {
  return sections.filter((s) => s.style === style).map((s) => s.content);
}

function firstSection(sections, style) {
  return sectionsBy(sections, style)[0] || null;
}

/** the authored CTA links of a section (decorateButtons already classed them) */
function ctaLinks(section) {
  return section ? [...section.querySelectorAll('a')] : [];
}

/** retypes an authored CTA as a canon button: primary when authored bold (strong) */
function asButton(a, base, primaryClass, secondaryClass) {
  const primary = a.classList.contains('primary') || a.classList.contains('accent')
    || !!a.closest('strong');
  a.className = [...base, primary ? primaryClass : secondaryClass].filter(Boolean).join(' ');
  return a;
}

/** logo link: aria-label from the authored text, the logo svg as its only paint */
function logoLink(brandLink, className, iconName) {
  const a = el('a', { class: className, href: brandLink.getAttribute('href') || '/' });
  a.setAttribute('aria-label', brandLink.textContent.trim() || 'Zendesk home');
  const svg = icon(iconName);
  if (svg) a.append(svg);
  return a;
}

/** locale links point at the same path on each locale site (canon request: per-path locales) */
function localizeLocaleLinks(links) {
  const path = window.location.pathname.replace(/^\//, '');
  links.forEach((a) => {
    try {
      const url = new URL(a.getAttribute('href'), window.location.href);
      const site = url.hostname === 'www.zendesk.com' || url.origin === window.location.origin;
      if (site && url.pathname === '/') {
        a.setAttribute('aria-current', 'page');
      }
      if (path && !path.startsWith('nav')) {
        url.pathname = `${url.pathname.replace(/\/?$/, '/')}${path}`;
        a.href = url.href;
      }
    } catch (e) {
      // keep the authored href
    }
  });
}

/* ------------------------------------------------------------------ gen A */

function buildPromo(section) {
  const inner = el('div', { class: 'za-promo-inner' });
  [...section.children].forEach((child) => {
    const link = child.querySelector('a');
    if (link) {
      link.className = 'za-promo-cta';
      wrapLinkText(link);
      inner.append(link);
    } else {
      child.classList.add('za-promo-txt');
      inner.append(child);
    }
  });
  // live keeps the CTA slot when a strip has no link: 0 wide, one CTA line high
  if (!inner.querySelector('.za-promo-cta')) {
    inner.append(el('span', { class: 'za-promo-cta za-promo-cta-empty', 'aria-hidden': 'true' }));
  }
  const close = el('button', { class: 'za-promo-close', type: 'button', 'aria-label': 'Close' });
  const x = icon('za-close');
  if (x) close.append(x);
  const promo = el('div', { class: 'za-promo', role: 'complementary', 'aria-label': 'top-promo' });
  promo.append(inner, close);
  close.addEventListener('click', () => { promo.hidden = true; });
  return promo;
}

function buildUtility(section, langLinks) {
  const langOff = /^(off|false|no|none)$/i.test(getMetadata('language'));
  const bar = el('div', { class: 'za-container za-hdr-bar' });
  const list = section.querySelector('ul');
  if (!list) return null;
  [...list.children].forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    if (sub) {
      if (langOff) return;
      const labelSpan = el('span', {}, ...itemLabelNodes(li));
      const name = labelSpan.textContent.trim().toLowerCase();
      const trigger = el('span', {
        class: 'za-nav2-link',
        role: 'menuitem',
        tabindex: '0',
        'aria-haspopup': 'true',
        'aria-label': `Open ${name} Selection Menu`,
      }, labelSpan);
      const links = [...sub.querySelectorAll('a')];
      langLinks.push(...links);
      const panel = el('div', { class: 'za-mega-panel' }, ...links);
      const menu = el('div', { class: 'za-mega za-lang', role: 'menu', 'aria-label': name }, panel);
      bar.append(el('div', {
        class: 'za-nav2-item', role: 'menubar', 'aria-label': `${name} Selection`,
      }, trigger, menu));
      return;
    }
    const a = li.querySelector('a');
    if (!a) return;
    a.className = 'za-nav2-link';
    a.append(el('span', {}, ...a.childNodes)); // LinkText span wraps icon + label (canon C1)
    const slug = (a.getAttribute('href') || '').split('/').filter(Boolean).pop() || 'link';
    bar.append(el('div', { class: 'za-nav2-item', role: 'navigation', 'aria-label': slug }, a));
  });
  return el('nav', { class: 'za-nav2', 'aria-label': 'Global Secondary Navigation' }, bar);
}

function buildMegaItem(li) {
  const { a, large, desc } = menuItemParts(li);
  if (!a) return null;
  const svg = a.querySelector('svg');
  const title = el('span', { class: 'za-mega-title' });
  [...a.childNodes].forEach((n) => { if (n !== svg) title.append(n); });
  const body = el('span', { class: 'za-mega-body' }, title, el('span', { class: 'za-mega-desc' }, ...desc));
  a.className = large ? 'za-mega-item za-mega-item-lg' : 'za-mega-item';
  if (svg) a.append(el('span', { class: 'za-mega-icon' }, svg));
  a.append(body);
  return el('li', {}, a);
}

/** groups of a mega panel: each authored list is a group, a heading before it is its label */
function buildGroups(nodes) {
  const groups = [];
  let label = null;
  nodes.forEach((n) => {
    if (/^H[1-6]$/.test(n.tagName)) {
      label = el('p', { class: 'za-mega-label' }, ...n.childNodes);
    } else if (n.matches('ul')) {
      groups.push({ label, ul: el('ul', {}, ...[...n.children].map(buildMegaItem)) });
      label = null;
    }
  });
  return groups;
}

function buildAside(nodes) {
  if (!nodes.length) return null;
  const aside = el('div', { class: 'za-mega-aside' });
  const links = nodes.flatMap((n) => (n.matches('a') ? [n] : [...n.querySelectorAll('a')]));
  const cta = links[links.length - 1];
  if (!cta) {
    aside.append(...nodes);
    return aside;
  }
  const card = el('a', { href: cta.getAttribute('href') });
  const label = nodes[0].matches('p') && !nodes[0].querySelector('picture, img, a') ? nodes[0] : null;
  if (label) {
    label.className = 'za-mega-label';
    aside.append(label);
  }
  nodes.filter((n) => n !== label).forEach((n) => {
    if (n.contains(cta)) {
      const span = el('span', { class: 'za-link' }, ...cta.childNodes);
      card.append(span);
    } else {
      const media = n.querySelector('picture, img');
      card.append(media && n.matches('p') ? media : n);
    }
  });
  aside.append(card);
  return aside;
}

function buildMenu(section, feature) {
  const nodes = [...section.children];
  const trigger = nodes.shift();
  if (!trigger) return null;
  const lastList = nodes.map((n) => n.matches('ul')).lastIndexOf(true);
  const link = trigger.querySelector('a');
  if (lastList < 0 && link) {
    link.className = 'za-menu-trigger';
    wrapLinkText(link);
    const name = link.textContent.trim().toLowerCase();
    return el('div', { class: 'za-menu', role: 'navigation', 'aria-label': name }, link);
  }
  const label = el('span', {}, ...trigger.childNodes);
  const chev = icon('za-chevron-down');
  if (chev) label.append(chev);
  const name = label.textContent.trim().toLowerCase();
  const menuTrigger = el('span', {
    class: 'za-menu-trigger',
    role: 'menuitem',
    tabindex: '0',
    'aria-haspopup': 'true',
    'aria-label': `Open ${name} Selection Menu`,
  }, label);
  const main = el('div', { class: 'za-mega-main' });
  const groups = buildGroups(nodes.slice(0, lastList + 1));
  if (feature && groups.length) {
    main.append(el('div', { class: 'za-mega-feature' }, groups.shift().ul));
  }
  if (groups.length === 1 && !groups[0].label) {
    main.append(el('div', { class: `za-mega-cols${feature ? ' za-mega-cols-2' : ''}` }, groups[0].ul));
  } else if (groups.length) {
    const cols = el('div', { class: 'za-mega-cols' });
    groups.forEach((g) => cols.append(el('div', { class: 'za-mega-group' }, g.label, g.ul)));
    main.append(cols);
  }
  const asideNodes = nodes.slice(lastList + 1);
  const panel = el('div', { class: 'za-mega-panel' }, main, buildAside(asideNodes));
  const mega = el('div', { class: 'za-mega', role: 'menu', 'aria-label': name }, panel);
  return el('div', {
    class: 'za-menu', role: 'menubar', 'aria-label': `${name} Selection`,
  }, menuTrigger, mega);
}

/** mobile drawer (< 970px): clones of the menus, sign-in and language; CTAs pinned below */
function buildDrawer(menus, utility, drawerCtas, close) {
  const drawer = el('div', { class: 'za-drawer', id: 'za-drawer', hidden: '' });
  const list = el('ul', { class: 'za-drawer-list' });
  const subs = [];
  const openSub = (sub) => {
    subs.forEach((s) => { s.hidden = s !== sub; });
    sub.querySelector('button')?.focus();
  };
  const addSub = (title, bodyNodes) => {
    const back = el('button', { class: 'za-drawer-back', type: 'button', 'aria-label': 'Back' });
    const backIcon = icon('za-chevron-down');
    if (backIcon) back.append(backIcon);
    const x = el('button', { class: 'za-drawer-close', type: 'button', 'aria-label': 'Close' });
    const xIcon = icon('za-close');
    if (xIcon) x.append(xIcon);
    const head = el('div', { class: 'za-drawer-subhead' }, back, el('p', {}, title), x);
    const sub = el(
      'div',
      { class: 'za-drawer-sub', hidden: '' },
      head,
      el('div', { class: 'za-drawer-subbody' }, ...bodyNodes),
    );
    back.addEventListener('click', () => { sub.hidden = true; });
    x.addEventListener('click', close);
    subs.push(sub);
    return sub;
  };
  const row = (labelNodes, sub, href) => {
    const chev = sub ? icon('za-chevron-down', 'za-drawer-chev') : null;
    const attrs = { class: 'za-drawer-row' };
    const ctl = href ? el('a', { ...attrs, href }) : el('button', { ...attrs, type: 'button' });
    ctl.append(...labelNodes);
    if (chev) ctl.append(chev);
    if (sub) ctl.addEventListener('click', () => openSub(sub));
    list.append(el('li', {}, ctl));
  };
  menus.forEach((menu) => {
    const trigger = menu.querySelector('.za-menu-trigger');
    const title = trigger.textContent.trim();
    const mega = menu.querySelector('.za-mega-main');
    if (mega) {
      const sub = addSub(title, [stripInstrumentation(mega.cloneNode(true))]);
      row([document.createTextNode(title)], sub);
    } else {
      row([document.createTextNode(title)], null, trigger.getAttribute('href'));
    }
  });
  if (utility) {
    utility.querySelectorAll('.za-nav2-item').forEach((item) => {
      const link = item.querySelector('a.za-nav2-link');
      const lang = item.querySelector('.za-lang');
      const label = stripInstrumentation(item.querySelector('.za-nav2-link > span').cloneNode(true));
      if (lang) {
        const sub = addSub(label.textContent.trim(), [stripInstrumentation(lang.cloneNode(true))]);
        row([...label.childNodes], sub);
      } else if (link && !/\/contact\/?$/.test(new URL(link.href).pathname)) {
        row([...label.childNodes], null, link.href);
      }
    });
  }
  const ctas = el('div', { class: 'za-drawer-ctas' });
  drawerCtas.forEach((a) => ctas.append(asButton(
    a,
    ['za-btn', 'za-btn-sm'],
    'za-btn-primary',
    'za-btn-secondary',
  )));
  ctas.querySelectorAll('a').forEach((a) => wrapLinkText(a));
  drawer.append(el('div', { class: 'za-drawer-main' }, list, ctas), ...subs);
  return drawer;
}

function stickyState(bars) {
  const tick = () => {
    bars.forEach((bar) => {
      const cs = getComputedStyle(bar);
      if (cs.position !== 'sticky') {
        bar.classList.remove('is-stuck');
        return;
      }
      const top = parseFloat(cs.top) || 0;
      const stuck = window.scrollY > 0 && bar.getBoundingClientRect().top <= top + 0.5;
      bar.classList.toggle('is-stuck', stuck);
    });
  };
  window.addEventListener('scroll', tick, { passive: true });
  tick();
}

function buildGenA(block, sections, pagePromo) {
  const promoSection = pagePromo || firstSection(sections, 'promo');
  const brand = firstSection(sections, 'brand')?.querySelector('a');
  const utilitySection = firstSection(sections, 'utility');
  const menuSections = sections.filter((s) => s.style === 'menu' || s.style === 'menu-feature');
  const tools = ctaLinks(firstSection(sections, 'tools'));
  const mobileCtas = ctaLinks(firstSection(sections, 'mobile-bar'));
  const drawerCtas = ctaLinks(firstSection(sections, 'drawer'));
  const slim = !utilitySection && !menuSections.length;

  const out = [];
  const main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main-content';
    out.push(el('a', { class: 'za-skip', href: `#${main.id}` }, 'Skip to main content'));
  }
  const promoOff = /^(off|false|no|none)$/i.test(getMetadata('promo'));
  if (promoSection && !promoOff) out.push(buildPromo(promoSection));

  /* desktop */
  const langLinks = [];
  const utility = utilitySection ? buildUtility(utilitySection, langLinks) : null;
  localizeLocaleLinks(langLinks);
  const menus = menuSections.map((s) => buildMenu(s.content, s.style === 'menu-feature'))
    .filter(Boolean);
  const dBar = el('div', { class: 'za-container za-hdr-bar' });
  if (brand) {
    dBar.append(el('div', { class: 'za-logo-wrap' }, logoLink(brand, 'za-logo', 'za-logo')));
  }
  if (menus.length) dBar.append(el('div', { class: 'za-menus' }, ...menus));
  const dCtas = el('div', { class: 'za-hdr-ctas' });
  tools.forEach((a) => {
    dCtas.append(asButton(a, ['za-btn', 'za-btn-sm'], 'za-btn-primary', 'za-btn-secondary'));
    wrapLinkText(a);
  });
  dBar.append(dCtas);
  const desktop = el('div', {
    class: `za-hdr za-hdr-desktop${slim ? ' za-hdr-slim' : ''}`, id: 'za-hdr-d',
  }, utility, el('nav', { class: 'za-nav1', 'aria-label': 'Global Primary Navigation' }, dBar));

  /* mobile */
  const mBar = el('div', { class: 'za-hdr-bar' });
  if (brand) mBar.append(logoLink(brand, 'za-logo', 'za-logo'));
  const mCtas = el('div', { class: 'za-hdr-ctas' });
  mobileCtas.forEach((a) => {
    mCtas.append(asButton(a, ['za-btn', 'za-btn-sm'], 'za-btn-primary', 'za-btn-primary'));
    wrapLinkText(a);
  });
  mBar.append(mCtas);
  const mNav = el('nav', { class: 'za-container za-hdr-nav', 'aria-label': 'Mobile Navigation' }, mBar);
  const mobile = el('div', {
    class: `za-hdr za-hdr-mobile${slim ? ' za-hdr-slim' : ''}`, id: 'za-hdr-m',
  }, mNav);

  if (menus.length) {
    const toggle = el('button', {
      class: 'za-hdr-toggle',
      type: 'button',
      'aria-label': 'Toggle Mobile Menu',
      'aria-expanded': 'false',
      'aria-controls': 'za-drawer',
    });
    const burger = icon('za-menu');
    const cross = icon('za-close');
    if (burger) toggle.append(burger);
    let drawer;
    const setOpen = (open) => {
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (burger && cross) toggle.replaceChildren(open ? cross : burger);
      if (open) {
        drawer.style.setProperty('--za-drawer-top', `${mBar.getBoundingClientRect().bottom}px`);
        drawer.querySelectorAll('.za-drawer-sub').forEach((s) => { s.hidden = true; });
      }
    };
    drawer = buildDrawer(menus, utility, drawerCtas, () => {
      setOpen(false);
      toggle.focus();
    });
    toggle.addEventListener('click', () => setOpen(drawer.hidden));
    mBar.append(toggle);
    mobile.append(drawer);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    DESKTOP.addEventListener('change', () => { if (DESKTOP.matches) setOpen(false); });
  }

  /* desktop menus: Escape closes the open panel (hover/focus-within open it, as live) */
  desktop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && desktop.contains(document.activeElement)) {
      const trigger = document.activeElement.closest('.za-menu, .za-nav2-item')
        ?.querySelector('[role="menuitem"]');
      document.activeElement.blur();
      trigger?.focus();
      trigger?.blur();
    }
  });

  out.push(mobile, desktop);
  block.replaceChildren(...out);
  stickyState([mobile, desktop]);
}

/* ------------------------------------------------------------------ gen B */

/** legacy dropdown item: <a><span><p>title</p><p>description</p></span></a> (title-only: span) */
function legacyItemLink(li) {
  const { a, desc } = menuItemParts(li);
  if (!a) return null;
  const title = [...a.childNodes].filter((n) => n.nodeName.toLowerCase() !== 'svg');
  if (desc.length) a.prepend(el('span', {}, el('p', {}, ...title), el('p', {}, ...desc)));
  else a.prepend(el('span', {}, ...title));
  a.className = '';
  markExternal(a, 'zb-ext');
  return a;
}

function legacyDropdownList(list) {
  return el('ul', {}, ...[...list.children].map((li) => {
    const a = legacyItemLink(li);
    return a ? el('li', {}, a) : null;
  }));
}

/** drawer copy of a dropdown list: no LinkText span, the title always in a <p> */
function legacyDrawerList(list, id) {
  const panel = stripInstrumentation(list.cloneNode(true));
  panel.className = 'zb-mobmenu-panel';
  panel.id = id;
  panel.hidden = true;
  panel.querySelectorAll('a > span').forEach((span) => span.replaceWith(...span.childNodes));
  panel.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('p')) return;
    const text = [...a.childNodes].filter((c) => c.nodeName.toLowerCase() !== 'svg');
    a.prepend(el('p', {}, ...text));
  });
  return panel;
}

function buildGenB(block, sections, pagePromo) {
  const brand = firstSection(sections, 'brand')?.querySelector('a');
  const utility = firstSection(sections, 'utility');
  const menuSections = sectionsBy(sections, 'menu');
  const tools = ctaLinks(firstSection(sections, 'tools'));
  const mobileCtas = ctaLinks(firstSection(sections, 'mobile-bar'));
  const drawerSection = firstSection(sections, 'drawer');
  const drawerGroups = []; // [{label, list(desktop clone source)}]

  /* secondary row */
  const secRow = el('div', { class: 'zb-secnav-row' });
  utility?.querySelectorAll(':scope > ul > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    const col = el('div', { class: 'zb-secnav-col' });
    if (sub) {
      const labelNodes = itemLabelNodes(li);
      const label = el('span', {}, ...labelNodes);
      const trigger = el('a', { href: '#' }, label);
      trigger.addEventListener('click', (e) => e.preventDefault());
      const list = legacyDropdownList(sub);
      drawerGroups.push({ title: label.textContent.trim(), list });
      col.append(trigger, el('div', { class: 'zb-secnav-dropdown' }, list));
    } else {
      const a = li.querySelector('a');
      if (!a) return;
      wrapLinkText(a);
      markExternal(a, 'zb-ext');
      col.append(a);
    }
    secRow.append(col);
  });
  const secondary = el(
    'div',
    { class: 'zb-container zb-header-secondary' },
    el('nav', {
      class: 'zb-secnav', role: 'navigation', 'aria-label': 'global-navigation-secondary',
    }, secRow),
  );

  /* primary row */
  const row = el('div', { class: 'zb-primnav-row' });
  if (brand) {
    row.append(el('div', { class: 'zb-primnav-logo' }, logoLink(brand, '', 'za-wordmark')));
  }
  const drawerItems = [];
  menuSections.forEach((section) => {
    const nodes = [...section.children];
    const trigger = nodes[0];
    const list = nodes.find((n) => n.matches('ul'));
    const item = el('div', { class: 'zb-primnav-item' });
    const link = trigger?.querySelector('a');
    if (!list && link) {
      link.className = 'zb-primnav-label';
      item.append(link);
      drawerItems.push({ title: link.textContent.trim(), href: link.getAttribute('href') });
    } else if (trigger && list) {
      const label = el('span', { class: 'zb-primnav-label', tabindex: '0' }, ...trigger.childNodes);
      const ul = legacyDropdownList(list);
      if ([...ul.querySelectorAll('a')].some(linkContainsPage)) label.classList.add('is-active');
      item.append(label, el('div', { class: 'zb-primnav-dropdown' }, ul));
      drawerItems.push({ title: label.textContent.trim(), list: ul });
    }
    row.append(item);
  });
  const ctas = el('div', { class: 'zb-primnav-ctas' });
  tools.forEach((a) => ctas.append(asButton(a, ['zb-btn', 'zb-btn-md'], 'zb-btn-primary', '')));
  row.append(ctas);
  const primary = el('div', { class: 'zb-header-primary' }, el(
    'div',
    { class: 'zb-container' },
    el('nav', {
      class: 'zb-primnav', role: 'navigation', 'aria-label': 'global-navigation-primary',
    }, row),
  ));

  /* mobile bar + accordion drawer (mounted on first open, as live) */
  const wrap = el('div', { class: 'zb-mobnav-wrap' });
  mobileCtas.forEach((a) => {
    wrap.append(asButton(a, ['zb-btn', 'zb-btn-sm'], 'zb-btn-primary', 'zb-btn-primary'));
    wrapLinkText(a);
  });
  const toggle = el('button', {
    class: 'zb-mobnav-toggle', type: 'button', 'aria-label': 'Toggle Mobile Menu', 'aria-expanded': 'false',
  });
  const burger = icon('zb-menu');
  if (burger) toggle.append(burger);
  wrap.append(toggle);
  const mobRow = el('div', { class: 'zb-mobnav-row' });
  if (brand) mobRow.append(el('div', { class: 'zb-mobnav-logo' }, logoLink(brand, '', 'za-wordmark')));
  mobRow.append(el('div', { class: 'zb-mobnav-right' }, wrap));
  const mobnav = el('nav', {
    class: 'zb-mobnav', role: 'navigation', 'aria-label': 'global-navigation-primary',
  }, mobRow);

  drawerSection?.querySelectorAll(':scope > ul > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    if (!sub) return;
    const title = el('span', {}, ...itemLabelNodes(li)).textContent.trim();
    drawerGroups.push({ title, list: legacyDropdownList(sub) });
  });
  const drawerLinks = drawerSection ? [...drawerSection.querySelectorAll(':scope > p a')] : [];

  let menu = null;
  const mountDrawer = () => {
    const list = el('ul', { class: 'zb-mobmenu-list' });
    let n = 0;
    [...drawerItems, ...drawerGroups].forEach((item) => {
      if (!item.list) {
        list.append(el('li', {}, el('a', { class: 'zb-mobmenu-head', href: item.href }, item.title)));
        return;
      }
      const id = `zb-mobmenu-${n}`;
      n += 1;
      const panel = legacyDrawerList(item.list, id);
      const head = el('button', {
        class: 'zb-mobmenu-head', type: 'button', 'aria-expanded': 'false', 'aria-controls': id,
      }, item.title, icon('zb-chevron', 'zb-mobmenu-chev'));
      head.addEventListener('click', () => {
        const open = head.getAttribute('aria-expanded') !== 'true';
        head.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
      });
      list.append(el('li', {}, head, panel));
    });
    const mctas = el('div', { class: 'zb-mobmenu-ctas' });
    drawerLinks.forEach((a) => {
      if (a.classList.contains('primary') || a.closest('strong')) {
        mctas.append(asButton(a, ['zb-btn', 'zb-btn-lg'], 'zb-btn-primary', ''));
      } else {
        a.className = 'zb-mobmenu-signin';
        mctas.append(a);
      }
    });
    menu = el('div', { class: 'zb-mobmenu', id: 'zb-mobmenu' }, list, mctas);
    mobnav.append(menu);
  };
  toggle.addEventListener('click', () => {
    if (!menu) mountDrawer();
    else menu.hidden = !menu.hidden;
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
  });

  const header = el(
    'div',
    { class: 'zb-header', 'aria-label': 'global-header' },
    secondary,
    primary,
    el('div', { class: 'zb-header-mobile' }, mobnav),
  );
  const strip = pagePromo ? buildPromo(pagePromo) : null;
  block.replaceChildren(...[strip, header].filter(Boolean));

  const update = () => {
    const top = (strip && !strip.hidden ? strip.offsetHeight : 0) + (secondary.offsetHeight || 0);
    header.classList.toggle('is-stuck', window.scrollY > top);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
/** page metadata `promo: /<doc>`: that document's promo section (else its first section) */
async function pagePromoSection() {
  const meta = getMetadata('promo');
  if (!meta.startsWith('/')) return null;
  const fragment = await loadFragment(new URL(meta, window.location).pathname);
  if (!fragment) return null;
  const sections = chromeSections(fragment);
  return (sections.find((s) => s.style === 'promo') || sections[0])?.content || null;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  if (/^(none|off)$/i.test(navMeta) || /\/nav-none\/?$/.test(navMeta)) return;
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const [fragment, pagePromo] = await Promise.all([loadFragment(navPath), pagePromoSection()]);
  if (!fragment) return;
  await loadIcons([...UI_ICONS, ...authoredIconNames(fragment)]);
  inlineIcons(fragment);
  const sections = chromeSections(fragment);
  const legacy = document.body.classList.contains('legacy') || /legacy/.test(navPath);
  if (legacy) {
    document.body.classList.add('legacy');
    block.classList.add('header-legacy');
    buildGenB(block, sections, pagePromo);
  } else {
    buildGenA(block, sections, pagePromo);
  }
}
