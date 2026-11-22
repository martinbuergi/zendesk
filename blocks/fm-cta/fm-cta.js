/**
 * fm-cta — form-template closing band (live /free-trial/ #teaser-cec89a28d8: ink ground + moss
 * glow, centred cream heading, the primary CTA, a check line, a sign-in line, a row of badges).
 *
 * Authoring (one cell, or one element per row/cell; classified by shape, kept in order):
 *   <h2> heading, CTA <p>s (<strong><a> primary, <em><a> secondary), text <p>s (the link-free
 *   one right after the CTAs carries the check mark), and badge images (<p><img></p>).
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

const isMedia = (n) => !!n.querySelector('picture, img') && !n.textContent.trim();
const isCta = (n) => n.tagName === 'P' && !!n.querySelector('strong > a, em > a, a.button');

export default function decorate(block) {
  if (block.querySelector(':scope > .fm-cta-glow')) return;
  const nodes = [...block.querySelectorAll(':scope > div > div')].flatMap((c) => [...c.children]);
  const col = el('div', 'fm-cta-col');
  const links = el('div', 'fm-cta-links');
  const badges = el('div', 'fm-cta-badges');
  let afterCta = false;
  nodes.forEach((n) => {
    if (isMedia(n)) {
      badges.append(n);
    } else if (/^H[1-6]$/.test(n.tagName)) {
      const h = el('div', 'fm-cta-h');
      h.append(n);
      col.append(h);
    } else if (isCta(n)) {
      if (!links.parentElement) col.append(links);
      links.append(n);
      afterCta = true;
    } else {
      const t = el('div', 'fm-cta-text');
      if (afterCta && !n.querySelector('a')) t.classList.add('fm-cta-check');
      afterCta = false;
      t.append(n);
      col.append(t);
    }
  });
  const container = el('div', 'za-container fm-cta-rel');
  container.append(col);
  if (badges.children.length) container.append(badges);
  block.classList.add('za-section');
  block.replaceChildren(el('div', 'fm-cta-glow'), container);
}
