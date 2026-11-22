/**
 * co-teaser — static-template teaser row (company): a text column (heading, body copy, CTAs)
 * beside a rounded square photo. Schema: stardust/eds-schema/company.json sections 1-3, 6.
 * Authoring: one row, cell 1 = heading (<h1> on the hero, <h2> elsewhere) + paragraphs +
 * CTA paragraphs (<strong><a> primary, <em><a> secondary); cell 2 = the image. A flattened
 * single cell works too (content is classified, not indexed).
 * A <p> before the heading is the eyebrow. Further rows (siblings): one cream card under the row
 * (live Card, same section) — heading + paragraphs, centred.
 * @variants class: hero | reverse | video (default: text left, photo right)
 *   hero    = page lead: lime glow ground, slides under the sticky header
 *   reverse = photo left, text right
 *   video   = text 5/12, media 6/12 (4:3) with a play control: the media cell carries the
 *             thumbnail, a link paragraph to the player in either cell
 *             (<p><a href="https://fast.wistia.net/embed/iframe/<id>">Play video</a></p>);
 *             the link becomes the round play button, a click swaps in the iframe (same src)
 * @ew-exempt link text of the video link — visually hidden label of the play button
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

// live intrinsic-image pattern: a transparent sizer shares the image box (presentational)
function addSizer(box, img, fw, fh) {
  const w = (img && img.getAttribute('width')) || fw;
  const h = (img && img.getAttribute('height')) || fh;
  if (!img || !w || !h || box.querySelector('.co-ii-sizer')) return;
  const s = el('img', 'co-ii-sizer');
  s.alt = '';
  s.setAttribute('aria-hidden', 'true');
  s.src = `data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27${w}%27%20height=%27${h}%27/%3e`;
  box.prepend(s);
  box.classList.add('has-sizer');
}

const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const isCta = (n) => n.tagName === 'P' && !!n.querySelector('a[href]')
  && (n.classList.contains('button-wrapper') || !!n.querySelector('strong > a, em > a, a.button'));

function collectNodes(row) {
  const out = [];
  row.querySelectorAll(':scope > div').forEach((cell) => {
    let kids = [...cell.children];
    // the runtime folds a media-led cell into one <p>: expand it back
    if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].children.length
      && kids[0].querySelector('picture, img') && kids[0].textContent.trim()) {
      kids = [...kids[0].childNodes].map((n) => {
        if (n.nodeType === 1) return n;
        // HARNESS-ONLY fallback: bare text node moved into a <p> (never fires on DA content)
        if (n.textContent.trim()) {
          const p = el('p');
          p.append(n);
          return p;
        }
        return null;
      }).filter(Boolean);
    }
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      // HARNESS-ONLY fallback: wrap the cell's text nodes (never fires on DA content)
      const p = el('p');
      p.append(...cell.childNodes);
      out.push(p);
    }
  });
  return out;
}

const isVideoLink = (n) => n.tagName === 'P' && n.children.length === 1
  && !!n.querySelector(':scope > a[href*="wistia"]');

const PLAY = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="currentColor" d="M18 14.5v19a1 1 0 0 0 1.53.85l15.2-9.5a1 1 0 0 0 0-1.7l-15.2-9.5A1 1 0 0 0 18 14.5"/></svg>';

function wireVideo(box, p) {
  const a = p.querySelector('a');
  const wrap = el('div', 'co-play-wrap');
  a.classList.add('co-play');
  const label = el('span', 'co-play-label');
  label.append(...a.childNodes);
  a.append(label);
  a.insertAdjacentHTML('afterbegin', PLAY);
  wrap.append(p);
  box.append(wrap);
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const frame = el('iframe', 'co-play-frame');
    frame.src = `${a.href}${a.href.includes('?') ? '&' : '?'}autoPlay=true`;
    frame.title = label.textContent;
    frame.allow = 'autoplay; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    box.append(frame);
    wrap.hidden = true;
  });
}

function buildCard(row) {
  const card = el('div', 'co-card');
  collectNodes(row).forEach((n) => card.append(n));
  return card;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .za-container')) return;
  const [first, ...rest] = [...block.children];
  const nodes = first ? collectNodes(first) : [];
  const media = nodes.find(isMedia);
  const video = nodes.find(isVideoLink);

  const txt = el('div', 'za-col co-txt');
  const eyebrow = el('div', 'co-eyebrow');
  const body = el('div', 'za-text co-text');
  const links = el('div', 'co-links');
  let headed = false;
  nodes.forEach((n) => {
    if (n === media || n === video) return;
    if (/^H[1-6]$/.test(n.tagName)) {
      txt.append(n);
      headed = true;
    } else if (isCta(n)) links.append(n);
    else if (!headed && n.tagName === 'P') eyebrow.append(n);
    else body.append(n);
  });
  if (eyebrow.children.length) txt.prepend(eyebrow);
  if (body.children.length) txt.append(body);
  if (links.children.length) txt.append(links);

  const row = el('div', 'za-row co-row');
  row.append(txt);
  if (media) {
    const col = el('div', 'za-col co-media');
    const box = el('span', 'co-ii');
    box.append(media);
    addSizer(box, media.matches('img') ? media : media.querySelector('img'));
    if (video) wireVideo(box, video);
    col.append(box);
    row.append(col);
  }

  const container = el('div', 'za-container co-rel');
  container.append(row);
  rest.forEach((r) => {
    if (r.textContent.trim()) container.append(buildCard(r));
  });
  if (container.children.length > 1) container.classList.add('za-row-gap');
  block.classList.add('za-section');
  const kids = [container];
  if (block.classList.contains('hero')) kids.unshift(el('div', 'co-glow'));
  block.replaceChildren(...kids);
}
