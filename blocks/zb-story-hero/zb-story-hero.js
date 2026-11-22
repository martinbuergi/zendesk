/**
 * zb-story-hero — gen-B customer-story hero: back link, logo row, h1, deck,
 * share row, CTA + optional video link (left 6/12), portrait image (5/12, offset 1).
 *
 * Authoring (one row; one or two cells — DA may flatten everything into one cell):
 *   cell 1, in order (every part optional except the h1):
 *     - back link       <p><a href="/customer/">Back to customer stories</a></p>   (before the h1)
 *     - logo(s)         <p><img></p> … (images before the h1)
 *     - headline        <h1>
 *     - deck            <p> text (one or more)
 *     - share links     <ul><li><a href="https://twitter.com/intent/…">Share on X</a></li>…</ul>
 *                       (icon from the link host; the link text stays as the accessible name)
 *     - CTA             <p><strong><a href="…">Find my solution</a></strong></p>
 *     - video link      <p><a href="https://fast.wistia.net/embed/iframe/<id>">Watch the video</a></p>
 *                       (Wistia / YouTube / Vimeo URL → the paragraph becomes a button that opens
 *                       the player, same media id, in a popover dialog)
 *   cell 2 (or the first image after the h1): the portrait image
 *
 * @ew-exempt <ul> share-link names render visually hidden (icon links), still authored + editable
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  back: ['0 0 16 16', 'm4.344 13.031 1.019-.665c-.709-1.463-2.26-2.97-3.413-3.767H16V7.402H1.861c1.197-.753 2.748-2.305 3.502-3.812l-1.019-.621C3.502 4.831 1.596 6.781 0 7.623v.753c1.64.842 3.502 2.792 4.344 4.654z'],
  play: ['0 0 16 16', 'M7.766 15.766c4.271 0 7.766-3.495 7.766-7.766S12.037.234 7.766.234 0 3.729 0 8s3.495 7.766 7.766 7.766M6.31 5.088 11.164 8 6.31 10.912z'],
  x: ['0 0 16 16', 'M9.3 6.9 14.4 1h-1.2L8.8 6.1 5.2 1H1.1l5.3 7.8L1.1 15h1.2L7 9.6l3.7 5.4h4.1zm-1.6 2-.6-.8-4.3-6.2h1.9l3.5 5 .5.8 4.5 6.5h-1.9z'],
  facebook: ['0 0 16 16', 'M15.043 8.043a7.043 7.043 0 1 0-14.086 0A7.044 7.044 0 0 0 6.899 15v-4.921H5.111V8.043h1.788V6.491c0-1.765 1.051-2.74 2.66-2.74.771 0 1.576.138 1.576.138v1.733h-.888c-.875 0-1.148.543-1.148 1.1v1.321h1.953l-.312 2.036H9.099V15a7.044 7.044 0 0 0 5.942-6.957z'],
  linkedin: ['0 0 16 16', 'M15.25 9.589v5.441h-3.109V9.953c0-1.275-.45-2.145-1.574-2.145-.86 0-1.37.586-1.595 1.153-.081.202-.102.485-.102.769v5.298H5.759s.042-8.598 0-9.487h3.109v1.346l-.021.031h.021v-.031c.413-.645 1.15-1.567 2.803-1.567 2.045 0 3.579 1.357 3.579 4.27zM2.509.97C1.445.97.75 1.678.75 2.61c0 .91.675 1.64 1.718 1.64h.021c1.085 0 1.757-.729 1.757-1.64C4.225 1.678 3.571.97 2.51.97zM.933 15.03h3.109V5.543H.933z'],
  rss: ['0 0 16 16', 'M8.462 15a8 8 0 0 0-.142-1.528q-.124-.71-.391-1.377c-.267-.667-.403-.862-.675-1.252a7.3 7.3 0 0 0-.959-1.137Q5.194 8.64 3.896 8.089c-1.298-.551-1.806-.551-2.825-.551v-2.15q.977 0 1.883.16.924.177 1.768.524c.844.347 1.104.524 1.626.879a9 9 0 0 1 1.475 1.226 9 9 0 0 1 1.226 1.475q.533.781.879 1.635c.346.854.406 1.161.524 1.777q.16.923.16 1.937zm-3.447-1.332a2.1 2.1 0 0 1-.48.693q-.302.302-.675.471c-.373.169-.515.169-.799.169q-.391 0-.764-.169c-.373-.169-.468-.269-.657-.471q-.301-.337-.471-.693c-.17-.356-.169-.497-.169-.782q0-.426.169-.8c.169-.374.269-.474.471-.675q.284-.302.64-.462c.356-.16.497-.16.782-.16q.426 0 .799.16c.373.16.474.261.675.462q.301.337.462.693c.161.356.16.497.16.782q0 .426-.142.782zM15 14.929h-2.274q0-1.207-.213-2.328c-.213-1.121-.355-1.466-.64-2.159a10.8 10.8 0 0 0-1.066-1.981q-.64-.96-1.492-1.83c-.852-.87-1.173-1.09-1.812-1.528q-.942-.639-1.981-1.075c-1.039-.436-1.419-.506-2.176-.648a12.5 12.5 0 0 0-2.345-.213V.999q1.457 0 2.807.266 1.332.266 2.567.791c1.235.525 1.614.785 2.372 1.306a14 14 0 0 1 2.15 1.795 15 15 0 0 1 1.794 2.15q.764 1.137 1.279 2.363c.515 1.226.598 1.67.764 2.559Q15 13.561 15 15z'],
};

function svgIcon(name) {
  const [viewBox, d] = ICONS[name];
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

function div(className, ...children) {
  const d = document.createElement('div');
  d.className = className;
  d.append(...children.filter(Boolean));
  return d;
}

const VIDEO_RE = /(wistia\.(?:com|net)|youtube\.com|youtu\.be|vimeo\.com)/i;

/** embed URL for a popover player, same media id as the authored link */
function embedUrl(href) {
  let m = href.match(/wistia\.(?:com|net)\/(?:embed\/(?:iframe|medias)|medias)\/([a-z0-9]+)/i);
  if (m) return `https://fast.wistia.net/embed/iframe/${m[1]}?autoPlay=true&videoFoam=true`;
  m = href.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  m = href.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
  return null;
}

function openPopover(src, title) {
  const dialog = document.createElement('dialog');
  dialog.className = 'zb-story-hero-popover';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'zb-story-hero-popover-close';
  close.setAttribute('aria-label', 'Close video');
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = title || 'Video';
  frame.allow = 'autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  dialog.append(close, div('zb-story-hero-popover-frame', frame));
  document.body.append(dialog);
  const dispose = () => { dialog.close(); dialog.remove(); };
  close.addEventListener('click', dispose);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dispose(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); dispose(); });
  dialog.showModal();
}

function shareIcon(href) {
  if (/twitter\.com|x\.com/i.test(href)) return 'x';
  if (/facebook\.com/i.test(href)) return 'facebook';
  if (/linkedin\.com/i.test(href)) return 'linkedin';
  if (/feed|rss|\.xml/i.test(href)) return 'rss';
  return null;
}

/** flatten cells into authored elements (expands the runtime's media-led <p> wrap, #104) */
function collect(cell) {
  const out = [];
  [...cell.children].forEach((kid) => {
    if (kid.tagName === 'P' && kid.querySelector('picture, img') && kid.children.length > 1
      && [...kid.childNodes].every((n) => n.nodeType === 1 || !n.textContent.trim())) {
      [...kid.children].forEach((c) => {
        const p = document.createElement('p');
        p.append(c);
        out.push(p);
      });
    } else out.push(kid);
  });
  // HARNESS-ONLY fallback: a bare-text cell (DA always wraps text in <p>)
  if (!out.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    out.push(p);
  }
  return out;
}

const isMedia = (el) => el.matches('picture, img') || (el.matches('p') && el.querySelector('picture, img') && !el.textContent.trim());

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  if (!cells.length) return;

  // a trailing cell that holds only an image is the portrait
  let mediaEl = null;
  const lastCell = cells.length > 1 ? cells[cells.length - 1] : null;
  if (lastCell && lastCell.querySelector('picture, img') && !lastCell.textContent.trim()) {
    mediaEl = lastCell.querySelector('picture') || lastCell.querySelector('img');
    cells.pop();
  }
  const nodes = cells.flatMap(collect);
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const headIdx = heading ? nodes.indexOf(heading) : -1;

  const back = div('zb-story-hero-back');
  const logos = div('zb-logorow zb-story-hero-logos');
  const head = div('zb-story-hero-headline');
  const deck = div('zb-story-hero-deck');
  const share = div('zb-social zb-story-hero-share');
  const links = div('zb-story-hero-links');
  const rest = div('zb-story-hero-rest');

  nodes.forEach((n, i) => {
    const before = headIdx < 0 || i < headIdx;
    const a = n.querySelector('a');
    if (n === heading) head.append(n);
    else if (isMedia(n)) {
      if (before) logos.append(n);
      else if (!mediaEl) mediaEl = n;
      else rest.append(n);
    } else if (n.matches('ul, ol') && n.querySelector('a')) {
      n.querySelectorAll('a').forEach((link) => {
        const name = shareIcon(link.href);
        const label = document.createElement('span');
        label.className = 'zb-story-hero-sr';
        label.append(...link.childNodes);
        link.append(...[name ? svgIcon(name) : null, label].filter(Boolean));
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      });
      share.append(n);
    } else if (a && VIDEO_RE.test(a.href)) {
      const src = embedUrl(a.href);
      const video = div('zb-story-hero-video', svgIcon('play'), n);
      if (src) {
        // EW6: read the href, unwrap the anchor; the authored <p> is the trigger (live: a button)
        a.replaceWith(...a.childNodes);
        n.dataset.video = src;
        n.setAttribute('role', 'button');
        n.tabIndex = 0;
        const open = () => openPopover(src, n.textContent.trim());
        n.addEventListener('click', open);
        n.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
      }
      links.append(video);
    } else if (a && before && !back.children.length && !n.querySelector('strong, em')) {
      a.prepend(svgIcon('back'));
      back.append(n);
    } else if (a) {
      links.append(n);
    } else if (!before) deck.append(n);
    else rest.append(n);
  });

  const text = div('zb-story-hero-text');
  [logos, head, deck, share, links, rest].forEach((part) => {
    if (part.children.length) text.append(part);
  });
  const main = div('zb-row zb-story-hero-main', text);
  if (mediaEl) {
    const img = mediaEl.querySelector('img') || mediaEl;
    if (img.tagName === 'IMG') {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    }
    main.append(div('zb-story-hero-media', mediaEl));
  }
  const container = div('zb-container');
  if (back.children.length) container.append(div('zb-row', back));
  container.append(main);
  block.replaceChildren(container);
}
