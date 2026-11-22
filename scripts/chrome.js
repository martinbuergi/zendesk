/*
 * Shared helpers for the chrome blocks (header, footer): inline SVG icons,
 * section lookup in the authored /nav and /footer fragments, link decoration.
 * Authored nodes are MOVED into the chrome DOM, never rebuilt from text (EW1);
 * presentational copies (mobile drawer, footer accordion) are clones stripped of
 * the Experience Workspace instrumentation (EW4).
 */

const ICONS = new Map();

/**
 * Fetches and caches the named SVG icons from /icons/.
 * @param {string[]} names icon names (file names without .svg)
 */
export async function loadIcons(names) {
  const todo = [...new Set(names)].filter((n) => n && !ICONS.has(n));
  await Promise.all(todo.map(async (name) => {
    try {
      const resp = await fetch(`${window.hlx.codeBasePath}/icons/${name}.svg`);
      if (!resp.ok) return;
      const doc = new DOMParser().parseFromString(await resp.text(), 'image/svg+xml');
      const svg = doc.documentElement;
      if (svg && svg.nodeName.toLowerCase() === 'svg') ICONS.set(name, svg);
    } catch (e) {
      // icon stays absent; the chrome still works
    }
  }));
}

/**
 * Returns an inline copy of a loaded icon (decorative unless a label is given).
 * @param {string} name icon name
 * @param {string} [className] class for the svg
 * @param {string} [label] accessible label (role img)
 * @returns {SVGElement|null}
 */
export function icon(name, className = '', label = '') {
  const src = ICONS.get(name);
  if (!src) return null;
  const svg = document.importNode(src, true);
  if (className) svg.setAttribute('class', className);
  svg.setAttribute('focusable', 'false');
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  return svg;
}

/**
 * Names of the authored icons (span.icon-*) under a root.
 * @param {Element} root container
 * @returns {string[]}
 */
export function authoredIconNames(root) {
  return [...root.querySelectorAll('span.icon')].map((span) => {
    const cls = [...span.classList].find((c) => c.startsWith('icon-'));
    return cls ? cls.substring(5) : '';
  }).filter(Boolean);
}

/**
 * Replaces the authored icon spans (decorateIcons output) with inline SVGs.
 * @param {Element} root container
 */
export function inlineIcons(root) {
  // decorateButtons() titles every paragraph link with its text; the source chrome has none
  root.querySelectorAll('a[title]').forEach((a) => {
    if (a.title === a.textContent) a.removeAttribute('title');
  });
  root.querySelectorAll('span.icon').forEach((span) => {
    const cls = [...span.classList].find((c) => c.startsWith('icon-'));
    const svg = cls ? icon(cls.substring(5)) : null;
    if (svg) span.replaceWith(svg);
  });
}

/**
 * Creates an element.
 * @param {string} tag tag name
 * @param {Object} [attrs] attributes (class, id, aria-*, …)
 * @param {...Node} children children to append
 * @returns {Element}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([name, value]) => {
    if (value !== null && value !== undefined && value !== false) node.setAttribute(name, value);
  });
  node.append(...children.filter(Boolean));
  return node;
}

/**
 * Removes the Experience Workspace instrumentation from a presentational clone (EW4).
 * @param {Element} root cloned subtree
 * @returns {Element} the same root
 */
export function stripInstrumentation(root) {
  const attrs = ['data-prose-index', 'data-image-index', 'data-block-index', 'id'];
  [root, ...root.querySelectorAll('*')].forEach((node) => {
    attrs.forEach((a) => node.removeAttribute(a));
  });
  return root;
}

/**
 * The authored sections of a chrome fragment, keyed by their section-metadata style.
 * @param {Element} fragment loaded fragment (main)
 * @returns {{style: string, content: Element}[]}
 */
export function chromeSections(fragment) {
  if (!fragment) return [];
  return [...fragment.querySelectorAll(':scope > .section')].map((section) => {
    const style = [...section.classList].find((c) => c !== 'section') || '';
    const content = section.querySelector(':scope > .default-content-wrapper') || section;
    return { style, content };
  });
}

/**
 * Links that open in a new tab on the source site: other hosts, and careers.
 * @param {HTMLAnchorElement} a link
 * @returns {boolean}
 */
export function opensNewTab(a) {
  let url;
  try {
    url = new URL(a.getAttribute('href'), window.location.href);
  } catch (e) {
    return false;
  }
  if (!/^https?:$/.test(url.protocol) || url.origin === window.location.origin) return false;
  if (url.hostname === 'www.zendesk.com') return url.pathname.startsWith('/company/careers');
  return true;
}

/**
 * Marks a new-tab link: target, rel, and the hidden "(opens in a new tab)" glyph.
 * @param {HTMLAnchorElement} a link
 * @param {string} glyphClass class of the hidden glyph (za-ext / zb-ext)
 */
export function markExternal(a, glyphClass) {
  if (!opensNewTab(a)) return;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  const glyph = icon('za-external', glyphClass, '(opens in a new tab)');
  if (glyph) a.append(glyph);
}

/**
 * Moves the link's text and inline children (not its svgs) into a span (LinkText).
 * @param {HTMLAnchorElement} a link
 * @param {string} [className] span class
 * @returns {HTMLSpanElement}
 */
export function wrapLinkText(a, className = '') {
  const span = el('span', className ? { class: className } : {});
  [...a.childNodes].forEach((n) => {
    if (n.nodeName.toLowerCase() !== 'svg') span.append(n);
  });
  a.prepend(span);
  return span;
}

/**
 * The label nodes of a list item that also holds a nested list (the pipeline may
 * deliver the label wrapped in a <p>, #98).
 * @param {HTMLLIElement} li list item
 * @returns {Node[]}
 */
export function itemLabelNodes(li) {
  const nodes = [];
  [...li.childNodes].forEach((n) => {
    if (n.nodeType === 1 && ['UL', 'OL'].includes(n.tagName)) return;
    if (n.nodeType === 1 && n.tagName === 'P') nodes.push(...n.childNodes);
    else nodes.push(n);
  });
  return nodes.filter((n) => n.nodeType === 1 || n.textContent.trim());
}

/**
 * Splits an authored menu item `<a>title</a><br>description` into its parts.
 * @param {HTMLLIElement} li list item
 * @returns {{a: HTMLAnchorElement|null, large: boolean, desc: Node[]}}
 */
export function menuItemParts(li) {
  const a = li.querySelector('a');
  if (!a) return { a: null, large: false, desc: [] };
  const holder = a.closest('strong') && li.contains(a.closest('strong')) ? a.closest('strong') : a;
  const desc = [];
  const collect = (start) => {
    let n = start;
    while (n) {
      if (!(n.nodeType === 1 && n.tagName === 'BR')) desc.push(n);
      n = n.nextSibling;
    }
  };
  collect(holder.nextSibling);
  if (holder.parentElement !== li) collect(holder.parentElement.nextSibling);
  return { a, large: holder !== a, desc };
}

/**
 * Is the page's path inside the link's section (for the legacy active state)?
 * @param {HTMLAnchorElement} a link
 * @returns {boolean}
 */
export function linkContainsPage(a) {
  try {
    const url = new URL(a.getAttribute('href'), window.location.href);
    const here = window.location.pathname;
    const path = url.pathname;
    return path.length > 1 && (url.hostname === 'www.zendesk.com'
      || url.origin === window.location.origin) && here.startsWith(path);
  } catch (e) {
    return false;
  }
}
