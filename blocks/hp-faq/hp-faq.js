/**
 * hp-faq — "Need to know more?" band: a show/hide toggle that reveals an accordion of
 * questions and answers.
 *
 * Authoring: the head is default content before the block (reabsorbed, EW8; a leading row
 * without a question/answer pair is the fallback): <h3> title, <p> show label, <p> hide label.
 * Rows: <h4> question | answer (<p>, <ul>, links).
 */

const CHEV_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="m19.352 9.218-7.366 7.366-7.338-7.338L5.85 8.044l6.136 6.136 6.164-6.164z" clip-rule="evenodd"></path></svg>';

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
  while (rows.length && rows[0].children.length === 1) {
    rows.shift().querySelectorAll(':scope > div').forEach((c) => nodes.push(...c.children));
  }
  return nodes;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headNodes = takeHead(block, rows);
  const uid = `faq-${Math.random().toString(36).slice(2, 7)}`;
  const title = headNodes.find(isHeading);
  const labels = headNodes.filter((n) => n !== title && n.tagName === 'P');
  const others = headNodes.filter((n) => n !== title && !labels.includes(n));
  const [showLabel, hideLabel] = labels;

  // ---- accordion ----
  const acc = el('div', 'hp-acc hp-faq-acc');
  acc.id = `${uid}-acc`;
  rows.forEach((r, i) => {
    const cells = [...r.children];
    const nodes = cells.flatMap((c) => [...c.children]);
    const q = nodes.find(isHeading) || nodes[0];
    if (!q) return;
    const answer = nodes.filter((n) => n !== q);
    const item = el('div', `hp-acc-item${i === 0 ? ' is-open' : ''}`);
    const qBox = el('div', 'hp-acc-title', q);
    qBox.id = `${uid}-q-${i}`;
    const btn = el('button', 'hp-acc-btn');
    btn.type = 'button';
    btn.innerHTML = CHEV_SVG;
    btn.setAttribute('aria-expanded', String(i === 0));
    btn.setAttribute('aria-controls', `${uid}-a-${i}`);
    btn.setAttribute('aria-labelledby', qBox.id);
    const head = el('div', 'hp-acc-head', qBox, btn);
    const panel = el('div', 'hp-acc-panel', el('div', 'hp-acc-inner', el('div', 'hp-faq-answer', ...answer)));
    panel.id = `${uid}-a-${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', qBox.id);
    if (i !== 0) {
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
    }
    head.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      if (open) panel.removeAttribute('aria-hidden'); else panel.setAttribute('aria-hidden', 'true');
    });
    item.append(head, panel);
    acc.append(item);
  });

  // ---- show / hide toggle (not a <summary>: it hosts authored labels, EW7) ----
  const details = el('div', 'hp-faq-details');
  const toggle = el('div', 'hp-faq-toggle');
  toggle.setAttribute('role', 'button');
  toggle.tabIndex = 0;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', acc.id);
  toggle.append(el('span', 'hp-faq-rule'));
  if (showLabel) toggle.append(el('div', 'hp-faq-show', showLabel));
  if (hideLabel) toggle.append(el('div', 'hp-faq-hide', hideLabel));
  const chev = el('span', 'hp-faq-chev');
  chev.innerHTML = CHEV_SVG;
  toggle.append(chev, el('span', 'hp-faq-rule'));
  const flip = () => {
    const open = !details.classList.contains('is-open');
    details.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', flip);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });
  details.append(toggle, acc);

  block.classList.add('za-section');
  if (block.closest('.section.forest')) block.classList.add('za-section-forest');
  const container = el('div', 'za-container');
  if (title) container.append(el('div', 'hp-faq-title', title));
  others.forEach((n) => container.append(n));
  container.append(details);
  block.replaceChildren(container);
}
