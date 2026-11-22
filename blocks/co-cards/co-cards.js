/**
 * co-cards — resource card grid on a cream section (live "Level up your customer service":
 * centred head 8/12, three Cards 4/12 — image 4:3, title, text, animated text link).
 *
 * Section head: default content before the block (<h2>, lede <p>) is reabsorbed into the centred
 * head row (EW8).
 * Authoring: one row per card — cell 1: the image; cell 2: <h3> title, <p> text, <p><a> link.
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

function buildHead(block) {
  const wrapper = block.parentElement && block.parentElement.previousElementSibling;
  if (!wrapper || !wrapper.classList.contains('default-content-wrapper')) return null;
  const row = el('div', 'za-row co-head');
  const col = el('div', 'za-col co-head-col');
  const body = el('div', 'za-text co-text');
  [...wrapper.children].forEach((n) => {
    if (/^H[1-6]$/.test(n.tagName)) col.append(n);
    else body.append(n);
  });
  if (body.children.length) col.append(body);
  wrapper.remove();
  row.append(col);
  return row;
}

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isLinkP = (n) => n.tagName === 'P' && n.children.length === 1 && !!n.querySelector(':scope > a[href]')
  && n.textContent.trim() === n.querySelector('a').textContent.trim();

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const head = buildHead(block);
  const grid = el('div', 'za-row co-cards-grid');
  [...block.children].forEach((r) => {
    const nodes = [...r.children].flatMap((c) => [...c.children]);
    if (!nodes.length) return;
    const card = el('div', 'co-card');
    const media = nodes.find(isMedia);
    if (media) {
      const m = el('div', 'co-card-media');
      m.append(media);
      card.append(m);
    }
    const body = el('div', 'co-card-body');
    const link = el('div', 'co-card-link');
    nodes.forEach((n) => {
      if (n === media) return;
      if (isLinkP(n)) link.append(n);
      else body.append(n);
    });
    card.append(body);
    if (link.children.length) card.append(link);
    const col = el('div', 'za-col co-cards-col');
    col.append(card);
    grid.append(col);
  });
  const container = el('div', 'za-container za-row-gap');
  if (head) container.append(head);
  container.append(grid);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
