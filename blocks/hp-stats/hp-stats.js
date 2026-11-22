/**
 * hp-stats — centred heading over a row of odometer figures with labels.
 *
 * Authoring: the heading is default content before the block (reabsorbed, EW8; a leading
 * heading-only row is the fallback). Rows: <p> figure (e.g. 22K+) | <p> label.
 * The authored figure stays as the accessible text; the reels are presentational
 * (aria-hidden: reel digits drawn from data attributes, the figure's literal characters
 * K / + / . / M / B repeated as aria-hidden spans, as on the source).
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);

function takeHead(block, rows) {
  const wrap = block.parentElement && block.parentElement.previousElementSibling;
  if (wrap && wrap.classList.contains('default-content-wrapper')) {
    const nodes = [...wrap.children];
    wrap.remove();
    return nodes;
  }
  const nodes = [];
  while (rows.length && rows[0].querySelector('h1, h2, h3, h4') && rows[0].children.length === 1) {
    rows.shift().querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

function odometer(figure) {
  const odo = el('div', 'hp-odo', el('div', 'za-sr', figure));
  [...figure.textContent.trim()].forEach((ch) => {
    if (/\d/.test(ch)) {
      const reel = el('div', 'hp-odo-reel');
      reel.dataset.v = ch;
      for (let d = 0; d < 10; d += 1) {
        const s = document.createElement('span');
        s.dataset.d = String(d);
        reel.append(s);
      }
      const col = el('div', 'hp-odo-col', reel);
      col.setAttribute('aria-hidden', 'true');
      odo.append(col);
    } else if (ch.trim()) {
      // a literal character of the authored figure, presentational (aria-hidden)
      const s = el('span', 'hp-odo-char', ch);
      s.setAttribute('aria-hidden', 'true');
      odo.append(s);
    }
  });
  return odo;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headNodes = takeHead(block, rows);
  block.classList.add('za-section');
  const container = el('div', 'za-container za-row-gap');
  if (headNodes.length) {
    const col = el('div', 'za-col hp-center-col');
    headNodes.forEach((n) => col.append(isHeading(n) ? el('div', 'hp-head-title', n) : n));
    container.append(el('div', 'za-row hp-center-row', col));
  }
  const list = el('div', 'hp-stats-list');
  rows.forEach((r) => {
    const nodes = [];
    r.querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
    if (!nodes.length) return;
    const figure = nodes.find((n) => /^[^a-z]*\d/i.test(n.textContent.trim()) && n.textContent.trim().length <= 12)
      || nodes[0];
    const rest = nodes.filter((n) => n !== figure);
    list.append(el(
      'div',
      'hp-stat',
      el('div', 'hp-stat-figure', odometer(figure)),
      rest.length ? el('div', 'hp-stat-label', ...rest) : null,
    ));
  });
  container.append(list);
  block.replaceChildren(container);
}
