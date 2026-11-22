/**
 * sv-promo — forest body-promo card (live .fvooCG, radius 40): image, title, CTA(s).
 * Schema: stardust/eds-schema/service.json section 1 (#teaser-f6624c8481).
 *
 * Authoring (one row; cells free, a single flattened cell also works):
 *   <picture> (badge / report image), a heading (<h2>, title of the card),
 *   optional body <p>, CTA <p>s (<strong><a> primary, <em><a> secondary).
 */

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (cell.children.length) out.push(...cell.children);
    else if (cell.textContent.trim()) {
      // HARNESS-ONLY fallback (EW5)
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      out.push(p);
    }
  });
  return out;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const nodes = collectNodes(block);
  const container = document.createElement('div');
  container.className = 'za-container';
  const card = document.createElement('div');
  card.className = 'sv-promo-card';
  card.setAttribute('role', 'complementary');
  const img = document.createElement('div');
  img.className = 'sv-promo-img';
  const body = document.createElement('div');
  body.className = 'sv-promo-body';
  const cta = document.createElement('div');
  cta.className = 'sv-promo-cta';
  nodes.forEach((n) => {
    const a = n.querySelector('a');
    if (n.matches('picture, img') || (n.querySelector('picture, img') && !n.textContent.trim())) img.append(n);
    else if (a && n.textContent.trim() === a.textContent.trim()) cta.append(n);
    else if (/^H[1-6]$/.test(n.tagName)) body.append(wrapNode(n, 'sv-promo-title'));
    else body.append(wrapNode(n, 'za-text sv-promo-text'));
  });
  if (img.children.length) card.append(img);
  card.append(body);
  if (cta.children.length) card.append(cta);
  container.append(card);
  block.classList.add('za-section');
  block.replaceChildren(container);
}
