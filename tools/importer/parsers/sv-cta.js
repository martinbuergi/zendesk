/* eslint-disable */
/* global WebImporter */

/**
 * sv-cta parser (template service-2).
 * Source: closing band section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-9) (dark glow band).
 *
 * Output (matches blocks/sv-cta/sv-cta.js and content/service.plain.html):
 *   one cell: optional eyebrow <p>, <h2>, optional body <p>,
 *             CTAs <p><strong><a> (first button) / <p><em><a> (further buttons)
 * No options.
 */
export default function parse(element, { document }) {
  const col = element.querySelector('div.sc-f23d7fd5-8 > div') || element;
  const content = [];
  let buttons = 0;

  const visit = (node) => {
    [...node.children].forEach((n) => {
      if (/^H[1-6]$/.test(n.tagName)) {
        if (!n.textContent.trim()) return;
        const h = document.createElement('h2');
        h.textContent = n.textContent.trim();
        content.push(h);
      } else if (n.matches('a[href]')) {
        const label = n.textContent.trim();
        if (!label) return;
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = n.getAttribute('href');
        a.textContent = label;
        if (/Buttonstyle__ButtonRoot/.test(n.className)) {
          const w = document.createElement(buttons === 0 ? 'strong' : 'em');
          w.append(a);
          p.append(w);
          buttons += 1;
        } else p.append(a);
        content.push(p);
      } else if (n.tagName === 'P') {
        if (!n.textContent.trim()) return;
        const p = document.createElement('p');
        p.textContent = n.textContent.trim();
        content.push(p);
      } else if (n.tagName === 'DIV' || n.tagName === 'SPAN') {
        visit(n);
      }
    });
  };
  visit(col);

  const block = WebImporter.Blocks.createBlock(document, { name: 'sv-cta', cells: [[content]] });
  element.replaceWith(block);
}
