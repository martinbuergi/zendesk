/**
 * hp-aifirst — dark full-bleed band: centred head, then the capability items as vertical
 * tabs (>= 768) and as an accordion (< 768).
 *
 * Authoring: the head (<h2>, <p>, CTAs <strong><a> primary / <em><a> on-dark) is default
 * content before the block (reabsorbed, EW8; a leading heading row without image is the
 * fallback). Rows: <h3> title | image | <p> text.
 * The authored items live in the accordion; the desktop tab list and panel are presentational
 * copies with the editor indices stripped (EW4).
 */

const CHEV_SVG = '<svg aria-hidden="true" focusable="false" class="hp-acc-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="m19.352 9.218-7.366 7.366-7.338-7.338L5.85 8.044l6.136 6.136 6.164-6.164z" clip-rule="evenodd"></path></svg>';

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

function stripInstrumentation(node) {
  if (node.nodeType !== 1) return node;
  node.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  node.removeAttribute('data-prose-index');
  node.removeAttribute('data-image-index');
  return node;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isCta = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

function takeHead(block, rows) {
  const wrap = block.parentElement && block.parentElement.previousElementSibling;
  if (wrap && wrap.classList.contains('default-content-wrapper')) {
    const nodes = [...wrap.children];
    wrap.remove();
    return nodes;
  }
  const nodes = [];
  while (rows.length && rows[0].querySelector('h2') && !rows[0].querySelector('picture, img')) {
    rows.shift().querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

function buildHead(nodes) {
  if (!nodes.length) return null;
  const heading = nodes.find(isHeading);
  const ctas = nodes.filter(isCta);
  const prose = nodes.filter((n) => n !== heading && !ctas.includes(n));
  const col = el('div', 'za-col hp-center-col');
  if (heading) col.append(el('div', 'hp-head-title', heading));
  if (prose.length) col.append(el('div', 'za-text za-text-light', ...prose));
  if (ctas.length) col.append(el('div', 'hp-linkgroup hp-linkgroup-center', ...ctas));
  return el('div', 'za-row hp-center-row', col);
}

export default function decorate(block) {
  const rows = [...block.children];
  const head = buildHead(takeHead(block, rows));
  const uid = `ai-acc-${Math.random().toString(36).slice(2, 7)}`;

  const items = rows.map((r) => {
    const nodes = [];
    r.querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
    const heading = nodes.find(isHeading);
    const mediaNode = nodes.find((n) => mediaOf(n));
    const media = mediaNode ? mediaOf(mediaNode) : null;
    const prose = nodes.filter((n) => n !== heading && n !== mediaNode);
    return {
      heading, media: media ? (media.closest('p') || media.closest('picture') || media) : null, prose,
    };
  }).filter((it) => it.heading || it.prose.length);

  // ---- accordion (authored nodes) ----
  const acc = el('div', 'hp-acc hp-aifirst-acc');
  items.forEach((it, i) => {
    const item = el('div', `hp-acc-item${i === 0 ? ' is-open' : ''}`);
    const title = el('div', 'hp-acc-title', it.heading);
    title.id = `${uid}-title-${i}`;
    const btn = el('button', 'hp-acc-btn');
    btn.type = 'button';
    btn.innerHTML = CHEV_SVG;
    btn.setAttribute('aria-expanded', String(i === 0));
    btn.setAttribute('aria-controls', `${uid}-panel-${i}`);
    btn.setAttribute('aria-labelledby', title.id);
    const headRow = el('div', 'hp-acc-head', title, btn);
    const inner = el('div', 'hp-acc-inner');
    if (it.media) inner.append(el('span', 'hp-acc-img', it.media));
    if (it.prose.length) inner.append(el('div', 'hp-acc-text', ...it.prose));
    const panel = el('div', 'hp-acc-panel', inner);
    panel.id = `${uid}-panel-${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', title.id);
    if (i !== 0) {
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
    }
    item.append(headRow, panel);
    const toggle = () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      if (open) panel.removeAttribute('aria-hidden'); else panel.setAttribute('aria-hidden', 'true');
    };
    headRow.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      toggle();
    });
    acc.append(item);
  });

  // ---- desktop tabs (presentational copies) ----
  const tabs = el('div', 'hp-tabs');
  const frame = el('div', 'hp-tabs-frame');
  const list = el('ul', 'hp-tabs-list');
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-orientation', 'vertical');
  const panel = el('div', 'hp-tabs-panel');
  panel.setAttribute('role', 'tabpanel');
  panel.id = `${uid}-tabpanel`;
  const tabEls = [];
  const show = (i) => {
    tabEls.forEach((t, k) => {
      t.classList.toggle('is-active', k === i);
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabEls[i].id);
    const it = items[i];
    const kids = [];
    if (it.media) {
      const m = mediaOf(it.media) || it.media;
      kids.push(el('span', 'hp-tabs-img', stripInstrumentation((m.closest('picture') || m).cloneNode(true))));
    }
    if (it.prose.length) {
      kids.push(el('div', 'hp-tabs-text', ...it.prose.map((p) => stripInstrumentation(p.cloneNode(true)))));
    }
    panel.replaceChildren(...kids);
  };
  items.forEach((it, i) => {
    const span = document.createElement('span');
    if (it.heading) {
      const copies = [...it.heading.childNodes].map((n) => stripInstrumentation(n.cloneNode(true)));
      span.append(...copies);
    }
    const tab = el('li', 'hp-tabs-tab', span);
    tab.id = `${uid}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.addEventListener('click', () => show(i));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        show(n);
        tabEls[n].focus();
      }
    });
    tabEls.push(tab);
    list.append(tab);
  });
  frame.append(list, panel);
  tabs.append(frame);
  if (items.length) show(0);

  block.classList.add('za-section');
  const inner = el('div', 'za-container hp-aifirst-inner za-row-gap', head, tabs, acc);
  block.replaceChildren(inner);
}
