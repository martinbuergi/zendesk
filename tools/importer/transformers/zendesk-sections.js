/* eslint-disable */
/* global WebImporter */

/**
 * Zendesk sections transformer (template service-2).
 * - Inserts <hr> section breaks between template sections (beforeTransform,
 *   while the parser target elements still exist).
 * - Inserts an extra <hr> before the hidden Contact Sales form
 *   (sv-form, mapped in rc12) so it lands in its own unstyled section after
 *   the closing sv-cta section, as in content/service.plain.html.
 * - Adds Section Metadata (style) for styled sections in afterTransform.
 */
const MARKER = 'data-excat-section-id';
const FIRST_MARKER = 'data-excat-first-section';
const FORM_MARKER = 'data-excat-form-break';
const FORM_SELECTOR = '#main-content > div > div:has(> div.sc-d0574c0f-1 > form)';

function findSectionEl(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector in this engine; try the next one
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    // Form break first (it sits after the last section in the DOM).
    const form = element.querySelector(FORM_SELECTOR);
    if (form) {
      const hr = doc.createElement('hr');
      hr.setAttribute(FORM_MARKER, '');
      form.before(hr);
    }

    const found = sections
      .map((section) => ({ section, el: findSectionEl(element, section) }))
      .filter((s) => s.el);

    for (let i = found.length - 1; i >= 0; i -= 1) {
      const { section, el } = found[i];
      if (i === 0) {
        if (section.style) {
          const hr = doc.createElement('hr');
          hr.setAttribute(MARKER, section.id);
          hr.setAttribute(FIRST_MARKER, '');
          el.before(hr);
        }
        continue;
      }
      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const start = marker || findSectionEl(element, section);
      if (!start) continue;

      const meta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      // Section ends right before the next <hr> sibling (or end of container).
      let last = marker ? marker : start;
      let next = last.nextElementSibling;
      while (next && next.tagName !== 'HR') {
        last = next;
        next = next.nextElementSibling;
      }
      last.after(meta);

      if (marker) {
        if (marker.hasAttribute(FIRST_MARKER)) {
          marker.remove();
        } else {
          marker.removeAttribute(MARKER);
        }
      }
    }

    element.querySelectorAll(`hr[${FORM_MARKER}]`).forEach((hr) => hr.removeAttribute(FORM_MARKER));
  }
}
