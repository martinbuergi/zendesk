/**
 * hp-pillars — promo card: a lead panel (lockup image, intro, primary CTA) beside a list
 * of pillars (image, title, text, CTA).
 *
 * Authoring rows:
 *   1. lead — cell 1: lockup image; cell 2: intro <p>(s) + CTA <strong><a>
 *   2..N. pillar — cell 1: image; cell 2: <h3> title, <p> text, CTA <em><a>
 * A row is a pillar when it carries a heading; the first heading-less row is the lead.
 */

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
const isCta = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

function nodesOf(row) {
  const out = [];
  row.querySelectorAll(':scope > div').forEach((cell) => out.push(...cell.children));
  return out;
}

function unit(n) {
  const m = mediaOf(n);
  return m ? (m.closest('p') || m.closest('picture') || m) : n;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const isPillar = (r) => r.querySelector('h1, h2, h3, h4, h5, h6');
  const leadRow = rows.find((r) => !isPillar(r));
  const pillarRows = rows.filter(isPillar);

  block.classList.add('za-section');
  const card = el('div', 'hp-pillars-card');
  card.setAttribute('role', 'complementary');
  card.setAttribute('aria-label', 'body-promo');

  if (leadRow) {
    const nodes = nodesOf(leadRow);
    const media = nodes.find((n) => mediaOf(n));
    const ctas = nodes.filter((n) => n !== media && isCta(n));
    const prose = nodes.filter((n) => n !== media && !ctas.includes(n));
    const lead = el('div', 'hp-pillars-lead');
    if (media) lead.append(el('div', 'hp-pillars-lockup', unit(media)));
    const intro = el('div', 'hp-pillars-intro');
    if (prose.length) intro.append(el('div', 'za-text za-text-light', ...prose));
    if (ctas.length) intro.append(el('div', 'hp-linkgroup', ...ctas));
    lead.append(intro);
    card.append(lead);
  }

  const list = el('div', 'hp-pillars-list');
  pillarRows.forEach((r) => {
    const nodes = nodesOf(r);
    const media = nodes.find((n) => mediaOf(n));
    const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
    const ctas = nodes.filter((n) => n !== media && isCta(n));
    const prose = nodes.filter((n) => ![media, heading, ...ctas].includes(n));
    const body = el('div', 'hp-pillar-body');
    if (heading) body.append(el('div', 'hp-pillar-title', heading));
    if (prose.length) body.append(el('div', 'za-text za-text-light', ...prose));
    if (ctas.length) body.append(el('div', 'hp-pillar-cta', ...ctas));
    const pillar = el('div', 'hp-pillar');
    if (media) pillar.append(el('div', 'hp-pillar-media', unit(media)));
    pillar.append(body);
    list.append(pillar);
  });
  if (pillarRows.length) card.append(list);

  block.replaceChildren(el('div', 'za-container', card));
}
