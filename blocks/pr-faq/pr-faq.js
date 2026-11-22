/**
 * pr-faq — "Frequently asked questions, answered." (live Garden Accordion): title column 4/12,
 * single-open accordion 7/12 (offset 1). The first item is open at rest, as served; opening an
 * item collapses the open one; panels animate grid-template-rows + padding (0.25 s).
 * Schema: stardust/eds-schema/pricing.json section 9 (#faqs).
 *
 * Authoring: head row = <h2>; then one row per item — cell 1: the question heading (<h5>);
 *   cell 2: the answer (<p>s, <ul>s, links).
 * The whole question row toggles; the question heading sits in a button-role wrapper (never
 * a <button>, EW7); the chevron is decorative.
 */

const CHECK = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m5.788-14.384-6.944 8.888-4.55-4.529a1 1 0 0 1 1.412-1.417l2.95 2.938 5.556-7.112a1 1 0 1 1 1.576 1.232"></path></svg>';
const CHEVRON = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="m19.352 9.218-7.366 7.366-7.338-7.338L5.85 8.044l6.136 6.136 6.164-6.164z" clip-rule="evenodd"></path></svg>';

let uid = 0;

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

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  uid += 1;
  const head = el('div', 'za-col pr-faq-head');
  const list = el('div', 'za-col pr-faq-list');
  const items = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const nodes = cells.flatMap((c) => [...c.children]);
    if (!nodes.length) return;
    const q = nodes.find(isHeading);
    // head row: a lone section heading (h2) with no answer cell
    if (cells.length < 2 && q && q.tagName === 'H2') {
      nodes.forEach((n) => head.append(n));
      return;
    }
    const i = items.length;
    const item = el('div', 'pr-faq-item');
    const bar = el('div', 'pr-faq-bar');
    bar.setAttribute('role', 'heading');
    bar.setAttribute('aria-level', q ? q.tagName.slice(1) : '5');
    const qWrap = el('div', 'pr-faq-q');
    const answer = [];
    nodes.forEach((n) => {
      if (n === q) qWrap.append(n);
      else answer.push(n);
    });
    // EW7 + live parity (a button-role row around the question): the authored heading is
    // never hosted by a <button>; its wrapper takes the button role (keyboard + aria)
    const trigger = qWrap;
    trigger.classList.add('pr-faq-trigger');
    trigger.id = `pr-faq-${uid}-t${i}`;
    trigger.setAttribute('role', 'button');
    trigger.tabIndex = 0;
    trigger.setAttribute('aria-controls', `pr-faq-${uid}-p${i}`);
    const btn = el('span', 'pr-faq-btn');
    btn.setAttribute('aria-hidden', 'true');
    btn.innerHTML = CHEVRON;
    bar.append(qWrap, btn);
    const panel = el('div', 'pr-faq-panel');
    panel.id = `pr-faq-${uid}-p${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', trigger.id);
    const text = el('div', 'za-text pr-faq-text');
    text.append(...answer);
    // decorative check glyph per answer list item (the authored item text is untouched)
    text.querySelectorAll('li').forEach((li) => {
      if (li.querySelector(':scope > .pr-li-ico')) return;
      const ico = el('span', 'pr-li-ico');
      ico.setAttribute('aria-hidden', 'true');
      ico.innerHTML = CHECK;
      li.prepend(ico);
    });
    panel.append(wrapNode(text, 'pr-faq-inner'));
    item.append(bar, panel);
    items.push(item);
    list.append(item);
  });

  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.pr-faq-trigger').setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  items.forEach((item, i) => {
    setOpen(item, i === 0);
    const toggle = () => {
      const open = !item.classList.contains('is-open');
      items.forEach((o) => { if (o !== item) setOpen(o, false); });
      setOpen(item, open);
    };
    item.querySelector('.pr-faq-bar').addEventListener('click', toggle);
    item.querySelector('.pr-faq-trigger').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      toggle();
    });
  });

  const row = el('div', 'za-row pr-faq-row');
  if (head.children.length) row.append(head);
  row.append(list);
  const container = el('div', 'za-container');
  container.append(row);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
