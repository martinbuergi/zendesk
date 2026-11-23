/* eslint-disable */
/* global WebImporter */

/**
 * Zendesk cleanup transformer.
 * Removes non-authorable site chrome (already migrated separately) and
 * third-party widgets/trackers. Selectors come from migration-work/cleaned.html.
 * Note: <nav> elements inside #main-content (stories carousel controls) and the
 * in-content Wistia embed trigger are intentionally kept for the parsers.
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Next.js lazy images: until scrolled into view the visible <img> holds a data: placeholder and
    // the real URL only lives in the sibling <noscript><img>. Copy it over before noscript is removed.
    const isPlaceholder = (src) => !src || src.startsWith('data:') || src.startsWith('blob:');
    element.querySelectorAll('noscript').forEach((ns) => {
      const html = ns.innerHTML || ns.textContent || '';
      const decode = (v) => v && v.replace(/&amp;/g, '&');
      const src = decode((html.match(/\ssrc="([^"]+)"/) || [])[1]);
      if (!src || isPlaceholder(src)) return;
      const srcset = decode((html.match(/\ssrcset="([^"]+)"/) || [])[1]);
      const img = [...(ns.parentElement?.querySelectorAll(':scope > img') || [])]
        .find((i) => i.getAttribute('aria-hidden') !== 'true');
      if (!img || !isPlaceholder(img.getAttribute('src'))) return;
      img.setAttribute('src', src);
      if (srcset) img.setAttribute('srcset', srcset); else img.removeAttribute('srcset');
    });
    // Carousels repeat slides; a copy that never lazy-loaded (React leaves its noscript empty) takes
    // the URL of a loaded copy with the same alt text.
    const byAlt = new Map();
    element.querySelectorAll('img[alt]').forEach((img) => {
      const alt = img.getAttribute('alt').trim();
      const s = img.getAttribute('src');
      if (alt && !isPlaceholder(s) && !byAlt.has(alt)) byAlt.set(alt, s);
    });
    element.querySelectorAll('img[alt]').forEach((img) => {
      const real = byAlt.get(img.getAttribute('alt').trim());
      if (real && isPlaceholder(img.getAttribute('src'))) {
        img.setAttribute('src', real);
        img.removeAttribute('srcset');
      }
    });
    // Still unresolved (client-rendered noscript is empty): read the server HTML, where every
    // next/image noscript holds the real URL, and match by the stable image id, else unique alt.
    const pending = [...element.querySelectorAll('img')]
      .filter((img) => img.getAttribute('aria-hidden') !== 'true' && isPlaceholder(img.getAttribute('src')));
    const pageUrl = payload?.params?.originalURL;
    if (pending.length && pageUrl) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', pageUrl, false);
        xhr.send();
        if (xhr.status === 200) {
          const server = new DOMParser().parseFromString(xhr.responseText, 'text/html');
          const byId = new Map();
          const altSeen = new Map();
          server.querySelectorAll('noscript img[src]').forEach((img) => {
            const s = img.getAttribute('src');
            if (isPlaceholder(s)) return;
            if (img.id && !byId.has(img.id)) byId.set(img.id, s);
            const alt = (img.getAttribute('alt') || '').trim();
            if (alt) altSeen.set(alt, altSeen.has(alt) && altSeen.get(alt) !== s ? null : s);
          });
          // Last resort for images without id or alt: find the nearest ancestor with text, locate the
          // server element with the same tag, class and text, and take its noscript image at the same index.
          const textKey = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
          const byContext = (img) => {
            let anc = img.parentElement;
            for (let depth = 0; anc && depth < 10 && textKey(anc).length < 20; depth += 1) anc = anc.parentElement;
            if (!anc || textKey(anc).length < 20) return null;
            const visible = [...anc.querySelectorAll('img')].filter((i) => i.getAttribute('aria-hidden') !== 'true');
            const idx = visible.indexOf(img);
            const cls = (anc.getAttribute('class') || '').split(/\s+/)[0];
            const sel = cls ? `${anc.tagName.toLowerCase()}.${CSS.escape(cls)}` : anc.tagName.toLowerCase();
            const key = textKey(anc);
            const match = [...server.querySelectorAll(sel)].find((el) => textKey(el) === key);
            const nsImgs = match ? [...match.querySelectorAll('noscript img[src]')] : [];
            return nsImgs.length === visible.length && nsImgs[idx] ? nsImgs[idx].getAttribute('src') : null;
          };
          pending.forEach((img) => {
            const alt = (img.getAttribute('alt') || '').trim();
            let real = (img.id && byId.get(img.id)) || (alt && altSeen.get(alt));
            if (!real) {
              try { real = byContext(img); } catch (e) { real = null; }
            }
            if (real && !isPlaceholder(real)) {
              img.setAttribute('src', real);
              img.removeAttribute('srcset');
            }
          });
        }
      } catch (e) {
        // keep placeholders; the validation step reports them
      }
    }
    // Next.js intrinsic-size spacer images (aria-hidden data: SVGs) are not content.
    element.querySelectorAll('img[aria-hidden="true"]').forEach((img) => {
      if (isPlaceholder(img.getAttribute('src'))) img.remove();
    });

    WebImporter.DOMUtils.remove(element, [
      // skip link
      'a[href="#main-content"]',
      // top announcement bar
      '#__next > div > div.sc-c5fa0909-6',
      // header / nav (desktop + mobile variants)
      '#__next > div > div[id^="header-"]',
      'header',
      // footer
      '#__next > div > div.sc-70d743a6-5',
      'footer',
      // chat widget launcher
      '#__next > div > button.sc-f75820d7-0',
      // Wistia video popover overlay (outside main)
      'div[id$="_popover_container"]',
      '.wistia_popover_embed',
      'wistia-tag-manager',
      // cookie banner
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      // hidden overlays, trackers, framework helpers
      'next-route-announcer',
      '#CrossStorageClient',
      '[id^="batBeacon"]',
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // tracking pixels / empty helper divs directly under body
    [...element.querySelectorAll(':scope > img, :scope > div:empty')].forEach((el) => el.remove());
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
      'source',
    ]);

    // strip tracking / inline-handler attributes left on content elements
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-track') || n.startsWith('data-ga') || n.startsWith('data-analytics') || n.startsWith('on')) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
