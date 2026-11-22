/**
 * pr-plans — pricing plan cards (live CardRoot eDfyXi; "Most Popular" kIQfGC) and, with the
 * `addons` variant, the "Featured add-ons" card row. Schema: stardust/eds-schema/pricing.json
 * sections 3 (#plans) and 4 (#addons).
 *
 * Authoring, one row per unit, classified by content:
 *   - head row: <h2> (addons) — centered section title;
 *   - cadence row (no heading): Monthly / Annual / discount <p>s — the billing toggle, rendered
 *     display:none as served on live;
 *   - card row (has <h3>): cell 1 = optional sticker <p> BEFORE the <h3> ("Most Popular" — marks
 *     the card popular), <h3> plan name, description <p>,
 *     price <p> (<strong>$19</strong> per-text),
 *     CTA <p>s (<strong><a> lime, <em><a> outlined) or a plain "Learn more" link <p>;
 *     cell 2 (optional) = lead <p> + <ul> of features; a feature <li> links to #modal.<slug>
 *     (rendered as a button-role trigger opening the pr-modal entry) and a leading <em>AI</em>
 *     renders the AI badge;
 *   - footer row (<h4>, no <h3>): "Still need help deciding? …" line under the grid.
 * @variants block: addons (default none)
 */

const AI_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" d="M7.828.623c.063-.83 1.28-.83 1.344 0a6.736 6.736 0 0 0 6.205 6.205c.83.063.83 1.28 0 1.344a6.736 6.736 0 0 0-6.205 6.205c-.063.83-1.28.83-1.344 0a6.736 6.736 0 0 0-6.205-6.205c-.83-.063-.83-1.28 0-1.344A6.736 6.736 0 0 0 7.828.623"></path><path fill="currentColor" d="M2.225 11.255c.026-.34.524-.34.55 0a2.14 2.14 0 0 0 1.97 1.97c.34.026.34.524 0 .55a2.14 2.14 0 0 0-1.97 1.97c-.026.34-.524.34-.55 0a2.14 2.14 0 0 0-1.97-1.97c-.34-.026-.34-.524 0-.55a2.14 2.14 0 0 0 1.97-1.97"></path></svg>';

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

const isHeading = (n, lv) => n && n.tagName === `H${lv}`;
const linkOf = (n) => (n.tagName === 'A' ? n : n.querySelector('a'));

// live feature names are buttons opening a modal: unwrap the authored link (EW6 — the indexed
// <li> keeps its text) into a keyboard-operable trigger read by pr-modal's handler
function featureTrigger(a) {
  const href = a.getAttribute('href');
  const t = el('span', 'pr-feat');
  t.setAttribute('role', 'button');
  t.tabIndex = 0;
  t.dataset.modalOpen = decodeURIComponent(href.slice(href.indexOf('#modal.') + 7));
  t.append(...a.childNodes);
  a.replaceWith(t);
}

function leadsWithStrong(p) {
  const first = [...p.childNodes].find((c) => c.nodeType === 1 || c.textContent.trim());
  return !!first && first.nodeType === 1 && first.tagName === 'STRONG';
}

// the per-unit text after the amount gets its own inline box (live: a separate span); the
// authored text node is moved, never copied, and a leading space stays outside the box
function wrapPer(p) {
  if (p.querySelector('.pr-price-per')) return;
  [...p.childNodes].filter((c) => c.nodeType === 3 && c.textContent.trim()).forEach((tn) => {
    const lead = tn.textContent.match(/^\s*/)[0].length;
    const node = lead ? tn.splitText(lead) : tn;
    const span = el('span', 'pr-price-per');
    node.replaceWith(span);
    span.append(node);
  });
}

function rowNodes(row) {
  return [...row.children].flatMap((c) => (c.children.length ? [...c.children] : []));
}

function buildCard(nodes) {
  const card = el('div', 'pr-card');
  const hIdx = nodes.findIndex((n) => isHeading(n, 3));
  const title = el('div', 'pr-card-cell pr-card-title');
  const desc = el('div', 'pr-card-cell pr-card-desc');
  const price = el('div', 'pr-card-cell pr-card-price');
  const ctas = el('div', 'pr-card-cell pr-card-ctas');
  const more = el('div', 'pr-card-cell pr-card-more');
  const feat = el('div', 'pr-card-cell pr-card-feat');
  const leftovers = [];
  nodes.forEach((n, i) => {
    const a = linkOf(n);
    if (i < hIdx) {
      card.classList.add('pr-card-pop');
      card.append(wrapNode(n, 'pr-card-sticker'));
    } else if (i === hIdx) title.append(n);
    else if (n.tagName === 'UL' || n.tagName === 'OL') {
      n.querySelectorAll('a[href*="#modal."]').forEach(featureTrigger);
      // AI badge glyph: a decorative svg before the authored "AI" text (text untouched)
      n.querySelectorAll('li > em').forEach((em) => {
        if (!em.querySelector('svg')) em.insertAdjacentHTML('afterbegin', AI_SVG);
      });
      feat.append(wrapNode(n, 'pr-feats'));
    } else if (n.tagName === 'P' && /^(UL|OL)$/.test(n.nextElementSibling?.tagName || '')) {
      feat.append(el('hr', 'pr-card-hr'), wrapNode(n, 'pr-card-lead'));
    } else if (a && n.textContent.trim() === a.textContent.trim()) {
      if (a.classList.contains('button') || a.closest('strong, em')) ctas.append(n);
      else {
        // LinkRoot > LinkText: the link label gets its own inline box (underline lives there)
        if (!a.querySelector('.pr-link-text')) {
          const label = el('span', 'pr-link-text');
          label.append(...a.childNodes);
          a.append(label);
        }
        more.append(n);
      }
    } else if (n.tagName === 'P' && !a && leadsWithStrong(n)) {
      wrapPer(n);
      price.append(n);
    } else if (n.tagName === 'P' && !desc.children.length) desc.append(n);
    else leftovers.push(n);
  });
  card.append(title, desc, price);
  if (!price.children.length) price.classList.add('pr-card-price-empty');
  if (ctas.children.length) {
    // a lone lime CTA (Contact us) carries a full-width label box on live (Garden button string)
    const as = ctas.querySelectorAll('a');
    if (as.length === 1 && !as[0].querySelector('.pr-cta-label')) {
      const label = el('span', 'pr-cta-label');
      const inner = el('span');
      inner.append(...as[0].childNodes);
      label.append(inner);
      as[0].append(label);
    }
    card.append(ctas);
  }
  if (more.children.length) card.append(more);
  if (feat.children.length) card.append(feat);
  if (leftovers.length) {
    const extra = el('div', 'pr-card-cell pr-card-extra');
    extra.append(...leftovers);
    card.append(extra);
  }
  return wrapNode(card, 'pr-plans-col');
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const addons = block.classList.contains('addons');
  const container = el('div', 'za-container');
  const head = el('div', 'pr-plans-head');
  const grid = el('div', 'pr-plans-grid');
  const foot = el('div', 'pr-compare');
  let cadence = null;

  [...block.children].forEach((row) => {
    const nodes = rowNodes(row);
    if (!nodes.length) return;
    if (nodes.some((n) => isHeading(n, 3))) grid.append(buildCard(nodes));
    else if (nodes.some((n) => isHeading(n, 2))) nodes.forEach((n) => head.append(n));
    else if (nodes.some((n) => isHeading(n, 4))) nodes.forEach((n) => foot.append(n));
    else {
      cadence = el('div', 'pr-cadence');
      nodes.forEach((n) => cadence.append(n));
    }
  });

  if (head.children.length) container.append(head);
  if (cadence) container.append(cadence);
  container.append(grid);
  if (foot.children.length) container.append(foot);
  if (addons) block.classList.add('za-section');
  block.replaceChildren(container);
}
