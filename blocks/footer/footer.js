import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  loadIcons, icon, authoredIconNames, inlineIcons, el, stripInstrumentation, chromeSections,
  markExternal, wrapLinkText,
} from '../../scripts/chrome.js';

/*
 * Footer: the authored /footer fragment slotted into the zendesk.com footer templates.
 *
 * Generation A, /footer: link columns (>= 481px) + accordion copy (< 481px), "How can we
 * help?" + social, legal row. /footer-legal: logo + legal links (form/landing pages).
 * Generation B, /footer-legacy: logo, intro + link columns, newsletter, social, legal.
 *
 * Sections are identified by their Section Metadata style:
 *   columns | help | social | legal | brand | intro | newsletter
 */

const UI_ICONS = ['za-external', 'za-acc-chevron', 'za-rot', 'za-wordmark', 'zb-mark'];

function sectionsBy(sections, style) {
  return sections.filter((s) => s.style === style).map((s) => s.content);
}

function firstSection(sections, style) {
  return sectionsBy(sections, style)[0] || null;
}

/** a footer text link: LinkText span (not for #anchors), new-tab glyph */
function footerLink(a, className, glyphClass) {
  a.className = className;
  if (!(a.getAttribute('href') || '').startsWith('#')) wrapLinkText(a);
  else if (a.getAttribute('href') === '#onetrust-show-cookie-settings') {
    a.id = a.id || 'onetrust-show-cookie-settings';
    a.classList.add('ot-sdk-show-settings'); // the OneTrust SDK binds + relabels this class
  }
  markExternal(a, glyphClass);
  return a;
}

/** social links: icon only, the authored text becomes the accessible name */
function socialList(section, glyphClass, wideClass) {
  const ul = section.querySelector('ul');
  if (!ul) return null;
  ul.querySelectorAll('a').forEach((a) => {
    const name = a.textContent.trim();
    if (name) {
      a.setAttribute('aria-label', name);
      if (glyphClass === 'za-ext') a.title = name;
    }
    a.className = '';
    const svg = a.querySelector('svg');
    if (svg && /youtube/i.test(name)) svg.classList.add(wideClass);
    [...a.childNodes].forEach((n) => { if (n !== svg) n.remove(); });
    markExternal(a, glyphClass);
  });
  return ul;
}

function legalNav(section, linkClass, glyphClass, navClass) {
  const links = section ? [...section.querySelectorAll('a')] : [];
  const nav = el('nav', { 'aria-label': 'legal-footer' });
  if (navClass) nav.className = navClass;
  links.forEach((a) => nav.append(footerLink(a, linkClass, glyphClass)));
  return nav;
}

/* ------------------------------------------------------------------ gen A */

function buildAccordion(columns) {
  const acc = el('div', { class: 'za-col za-ftr-acc' });
  let n = 0;
  columns.forEach((col) => {
    col.querySelectorAll('h3').forEach((h3) => {
      const list = h3.nextElementSibling?.matches('ul') ? h3.nextElementSibling : null;
      if (!list) return;
      const id = `za-ftr-p${n}`;
      const open = n === 0;
      n += 1;
      const heading = el('h5', {}, h3.textContent);
      const btn = el('button', {
        class: 'za-acc-btn', type: 'button', 'aria-expanded': String(open), 'aria-controls': id,
      }, heading);
      const head = el(
        'div',
        { class: 'za-acc-head', role: 'heading', 'aria-level': '5' },
        btn,
        icon('za-acc-chevron', 'za-acc-icon'),
        icon('za-rot', 'za-rot'),
      );
      const panel = el('section', { class: 'za-acc-panel', id });
      list.querySelectorAll('a').forEach((a) => {
        panel.append(el('div', {}, stripInstrumentation(a.cloneNode(true))));
      });
      const item = el('div', { class: `za-acc-item${open ? ' is-open' : ''}` }, head, panel);
      btn.addEventListener('click', () => {
        const isOpen = !item.classList.contains('is-open');
        item.classList.toggle('is-open', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
      });
      acc.append(item);
    });
  });
  return acc;
}

function buildGenA(block, sections) {
  const columns = sectionsBy(sections, 'columns').map((section) => {
    const col = el('div', { class: 'za-col za-ftr-cols' });
    [...section.children].forEach((child) => {
      if (child.matches('h2')) return;
      if (child.matches('ul')) {
        child.querySelectorAll('a').forEach((a) => footerLink(a, 'za-ftr-a', 'za-ext'));
      }
      col.append(child);
    });
    return col;
  });
  const srTitle = sections.map((s) => s.content.querySelector(':scope > h2')).find(Boolean);
  if (srTitle) srTitle.className = 'za-sr';

  const linksRow = el('div', { class: 'za-row' }, buildAccordion(columns), ...columns);

  const help = firstSection(sections, 'help');
  const ask = el('div', { class: 'za-col za-ftr-ask' });
  if (help) {
    const h3 = help.querySelector('h3');
    h3?.querySelectorAll('a').forEach((a) => wrapLinkText(a));
    // the pipeline trims the space after <br>; >= 768px hides the <br>, so restore it
    h3?.querySelectorAll('br').forEach((br) => {
      if (!/^\s/.test(br.nextSibling?.textContent || '')) br.after(' ');
    });
    if (h3) ask.append(h3);
  }
  const social = firstSection(sections, 'social');
  const socialCol = el(
    'div',
    { class: 'za-col za-ftr-social' },
    social ? socialList(social, 'za-ext', 'za-yt') : null,
  );
  const helpRow = el(
    'div',
    { class: 'za-row za-ftr-help' },
    el('div', { class: 'za-col' }, el('div', { class: 'za-row' }, ask, socialCol)),
  );

  const legalRow = el(
    'div',
    { class: 'za-row za-ftr-legal' },
    el('div', { class: 'za-col' }, legalNav(firstSection(sections, 'legal'), 'za-ftr-a', 'za-ext')),
  );

  const grid = el('div', { class: 'za-ftr-grid' }, linksRow, helpRow, legalRow);
  const container = el('div', { class: 'za-container' }, srTitle, grid);
  // live shape: div.za-ftr (ground + padding) > footer (the landmark, no padding) > container
  const landmark = el('footer', { id: 'footer', role: 'contentinfo' }, container);
  block.replaceChildren(el('div', { class: 'za-ftr' }, landmark));
}

/**
 * slim legal footer (contact / form pages): logo + legal links. A doc without a brand section
 * renders logo-less with centred links (`za-ftr-slim-plain`); a section styled `minimal` gives
 * the legacy global-footer-minimal look (`za-ftr-slim-minimal`).
 */
function buildGenALegal(block, sections) {
  const brandSection = firstSection(sections, 'brand');
  const brand = brandSection?.querySelector('a');
  let brandCol = null;
  if (brandSection) {
    const home = el('a', { class: 'za-ftr-slim-home', href: brand?.getAttribute('href') || '/' });
    home.setAttribute('aria-label', brand?.textContent.trim() || 'Zendesk');
    home.append(el('span', {}, icon('za-wordmark', 'za-ftr-slim-logo')));
    brandCol = el('div', { class: 'za-col za-ftr-slim-brand' }, home);
  }
  const minimal = sections.some((s) => s.content.closest('.section.minimal'));
  const classes = ['za-ftr-slim', !brandSection && 'za-ftr-slim-plain'];
  if (minimal) classes.push('za-ftr-slim-minimal');
  const row = el(
    'div',
    { class: 'za-row za-ftr-slim-row' },
    brandCol,
    el(
      'div',
      { class: 'za-col za-ftr-slim-navcol' },
      legalNav(firstSection(sections, 'legal'), 'za-ftr-slim-a', 'za-ext', 'za-ftr-slim-nav'),
    ),
  );
  block.replaceChildren(el(
    'footer',
    { class: classes.filter(Boolean).join(' '), id: 'footer', role: 'contentinfo' },
    el('div', { class: 'za-container' }, row),
  ));
}

/* ------------------------------------------------------------------ gen B */

function buildNewsletter(section) {
  const intro = el('div', { class: 'zb-newsletter-intro' });
  const form = el('form', { class: 'zb-newsletter-form', novalidate: '' });
  if (!section) return { intro, form };
  const heading = section.querySelector('h2, h3, h4');
  if (heading) {
    heading.className = 'zb-h4 zb-newsletter-title';
    intro.append(heading);
  }
  const paras = [...section.querySelectorAll(':scope > p')];
  const [lede, placeholder, label, tip] = paras;
  if (lede) {
    lede.className = 'zb-text';
    intro.append(lede);
  }
  const input = el('input', {
    class: 'zb-newsletter-input',
    id: 'zb-newsletter-email',
    type: 'email',
    placeholder: placeholder ? placeholder.textContent.trim() : null,
    'aria-label': 'Work email',
  });
  const button = el('button', { class: 'zb-btn zb-btn-lg zb-btn-primary', type: 'submit' });
  if (label) button.append(...label.childNodes);
  form.append(el('div', { class: 'zb-newsletter-group' }, input, button));
  if (tip) {
    form.append(el(
      'div',
      { class: 'zb-newsletter-tip', role: 'tooltip', 'aria-hidden': 'true' },
      ...tip.childNodes,
    ));
  }
  /* the live subscription endpoint is a dynamics decision; keep the visitor on the page */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    input.reportValidity();
  });
  return { intro, form };
}

function buildGenB(block, sections) {
  const brand = firstSection(sections, 'brand')?.querySelector('a');
  const logo = el('a', { class: 'zb-footer-logo', href: brand?.getAttribute('href') || '/' });
  logo.setAttribute('aria-label', brand?.textContent.trim() || 'Zendesk');
  const mark = icon('zb-mark');
  if (mark) logo.append(mark);

  const cols = el('div', { class: 'zb-row zb-footer-cols' });
  const columns = firstSection(sections, 'columns');
  let col = null;
  [...(columns?.children || [])].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      col = el('div', { class: 'zb-footer-col' });
      child.className = child.tagName === 'H2' ? 'zb-eyebrow' : 'zb-h4';
      cols.append(col);
    }
    if (!col) return;
    if (child.matches('ul')) {
      child.querySelectorAll('a').forEach((a) => {
        a.className = '';
        wrapLinkText(a);
        markExternal(a, 'zb-ext');
      });
    }
    col.append(child);
  });

  const { intro, form } = buildNewsletter(firstSection(sections, 'newsletter'));
  const social = firstSection(sections, 'social');
  const bottom = el(
    'div',
    { class: 'zb-row zb-footer-bottom' },
    el('div', { class: 'zb-footer-intro-col' }, intro),
    el('div', { class: 'zb-footer-form-col' }, form),
    el(
      'div',
      { class: 'zb-footer-social-col zb-social' },
      social ? socialList(social, 'zb-ext', 'zb-social-wide') : null,
    ),
  );

  const legal = el('div', { class: 'zb-row zb-footer-legal-row' }, el(
    'div',
    { class: 'zb-col-12' },
    legalNav(firstSection(sections, 'legal'), '', 'zb-ext', 'zb-legal'),
  ));

  const top = el(
    'div',
    { class: 'zb-footer-top' },
    el('div', { class: 'zb-row' }, el('div', { class: 'zb-col' }, logo)),
    cols,
  );
  block.replaceChildren(el('footer', { class: 'zb-footer', role: 'contentinfo' }, el(
    'div',
    { class: 'zb-container' },
    top,
    el('hr', { class: 'zb-footer-rule' }),
    bottom,
    legal,
  )));
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;
  await loadIcons([...UI_ICONS, ...authoredIconNames(fragment)]);
  inlineIcons(fragment);
  const sections = chromeSections(fragment);
  // the inner <footer> (as on the live site) is the contentinfo landmark; the host is a shell
  block.closest('body > footer')?.setAttribute('role', 'none');
  const legacy = document.body.classList.contains('legacy') || /legacy/.test(footerPath);
  if (legacy) {
    block.classList.add('footer-legacy');
    buildGenB(block, sections);
  } else if (!sections.some((s) => s.style === 'columns')) {
    block.classList.add('footer-slim');
    buildGenALegal(block, sections);
  } else {
    buildGenA(block, sections);
  }
}
