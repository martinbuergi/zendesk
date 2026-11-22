/**
 * zb-article — gen-B customer-story body: prose in a centred 9/12 column.
 *
 * Authoring: one cell holding the story as rich text — <p>, sub-heads <h2>–<h4>
 * (all rendered at the canon zb-h4 size), lists, images. Extra rows/cells are
 * appended in order.
 * A paragraph holding only a bare Wistia embed URL (link text = the URL) renders the
 * player inline at 16:9 (embed-passthrough, same src; the authored link stays, hidden).
 * Variant split-sections: the story body as alternating bands — each sub-head opens a band
 * holding its text beside its image paragraph(s) (live Basestyle two-column sections).
 *
 * @ew-exempt link (bare Wistia URL paragraph) — embed source URL, rendered as the iframe
 */

const WISTIA_RE = /^https:\/\/fast\.wistia\.(?:net|com)\/embed\/(?:iframe|medias)\/[a-z0-9]+/i;

function embed(p) {
  const a = p.children.length === 1 && p.firstElementChild.tagName === 'A' ? p.firstElementChild : null;
  if (!a || p.querySelector('iframe') || !WISTIA_RE.test(a.href)
    || a.textContent.trim() !== a.getAttribute('href').trim()) return;
  const iframe = document.createElement('iframe');
  iframe.src = a.href;
  iframe.title = 'Wistia video player';
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; fullscreen';
  iframe.allowFullscreen = true;
  p.classList.add('zb-article-embed');
  p.append(iframe);
}

function div(className, ...children) {
  const d = document.createElement('div');
  d.className = className;
  d.append(...children.filter(Boolean));
  return d;
}

const isImagePara = (el) => el.tagName === 'P' && el.querySelector(':scope > picture')
  && !el.textContent.trim();

// split-sections: regroup the column at each sub-head into bands (image | text); nodes are moved
function splitBands(col) {
  const bands = [];
  let band;
  [...col.children].forEach((el) => {
    if (!band || /^H[2-6]$/.test(el.tagName)) {
      band = { media: div('zb-article-media'), text: div('zb-article-text') };
      bands.push(band);
    }
    (isImagePara(el) ? band.media : band.text).append(el);
  });
  return bands.map(({ media, text }) => div(
    'zb-article-band',
    div('zb-container', div('zb-row', media.children.length ? media : null, text)),
  ));
}

export default function decorate(block) {
  const col = div('zb-article-col');
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (cell.children.length) col.append(...cell.children);
    else if (cell.textContent.trim()) {
      // HARNESS-ONLY fallback: bare text in a cell (DA always wraps text in <p>)
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      col.append(p);
    }
  });
  if (!col.children.length) return;
  col.querySelectorAll(':scope > p').forEach(embed);
  if (block.classList.contains('split-sections')) {
    block.replaceChildren(...splitBands(col));
    return;
  }
  block.replaceChildren(div('zb-container', div('zb-row', col)));
}
