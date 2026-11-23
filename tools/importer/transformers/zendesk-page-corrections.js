/* eslint-disable */
/* global WebImporter */
// Persisted content edits (excat-persist-content-edit). Page corrections run on the page body for
// their URL; fragment corrections run on a fragment the import splits out, whichever page writes it.
// Keep `export default` the only export: the transformer save hook loads this file as a classic script.

const CORRECTIONS = {
  // '<page URL: origin and path, no trailing slash, query or hash>': [(main, document) => { ... }],
  'https://www.zendesk.com/employee-service/itsm': [
    // DuPage County logo: the source SVG is 156KB and Edge Delivery rejects SVGs over 40KB;
    // use the same seal as a PNG (from the migrated DuPage customer story).
    (main) => main.querySelectorAll('img[src$="/partner-logos/TheCountyofDupage_Logo.svg"]').forEach((img) => {
      img.setAttribute('src', 'https://main--zendesk--martinbuergi.aem.page/customer/media_18b6202c51e3e286c745b1b116ea588752c5b52fd.png');
      img.removeAttribute('srcset');
    }),
  ],
};

const FRAGMENT_CORRECTIONS = {
  // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
};

const pageKey = (u) => {
  try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
  catch { return u; }
};

// The fragment's document path as the import saves it: no `.`, empty or trailing segments.
const fragmentKey = (p) => String(p).replace(/\\/g, '/').replace(/\.plain\.html$/, '').split('/')
  .reduce((parts, part) => {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
    return parts;
  }, [])
  .join('/');

function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
  const { document, params } = payload || {};
  if (!document || !params) return;
  if (element === document.body) {
    if (!params.originalURL) return;
    (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document));
    return;
  }
  const fragment = (params.fragments || []).find((f) => f.element === element);
  if (!fragment || typeof fragment.path !== 'string') return;
  (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document));
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
}
