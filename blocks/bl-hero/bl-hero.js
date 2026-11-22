/**
 * bl-hero — blog listing hero: lead story (left), editor's picks + subscribe card (right) on a lime
 *   wash.
 * Picks are a 2-column grid from 1150 and, below it, a slick-style slider holding a stripped clone
 *   of the grid.
 *
 * Authoring (one row per unit, classified by content, not position):
 *   lead       image | <h3><a href>title</a></h3> + <p>description</p>   (rows with an image before
 *     the picks head)
 *   picks head <h1>Zendesk Blog</h1> + <h2>Editor's picks</h2>           (the page's single h1,
 *     sticker look)
 *   pick       image | <h3><a href>title</a></h3>                         (rows with an image after
 *     the head)
 *   subscribe  <h4>title</h4> <p>text</p> <p>placeholder</p> <p>button label</p> <p>input hint</p>
 *
 * Variants (listing hubs and directories; the variant classes come from the sibling render):
 *   hub        centred <h1> + <p> intro; optional search row (<p>placeholder</p>) and, with
 *              `links`,
 *              a link-list row (<ul><li><a>…</a></li></ul>, 3 columns)
 *   directory  breadcrumb <ul> (links, last item the current page) + <h2> title + <h3> intro
 *   legacy     gen-B split: copy row (<h2> eyebrow, <h1>, <h5>) | media row (image + optional
 *              <p><a href="wistia|youtube|vimeo">Play video</a></p> → popover player)
 *   lead       featured story: media cell | copy cell (<h2> eyebrow, <h2> title, CTA)
 *   tint-sand / tint-aqua  band colours
 *
 * @ew-exempt <p> hub search placeholder (the only cell of a text-only row without a heading) —
 *   derived into the search input placeholder (form, EW5 c; D9: submits to the source search)
 * @ew-exempt <p> subscribe placeholder (3rd p of the subscribe row) — derived into the input
 *   placeholder (form, EW5 c)
 * @ew-exempt <p> subscribe button label (4th p of the subscribe row) — derived into the submit
 *   button (form, EW5 c)
 */

const ARROW = {
  // eslint-disable-next-line max-len
  prev: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="m5.052 12.85 3.549 3.55-1.202 1.202L1.798 12l5.601-5.602 1.202 1.203-3.549 3.549H21v1.7z"></path></svg>',
  // eslint-disable-next-line max-len
  next: '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M18.948 11.15 15.399 7.6l1.202-1.202L22.202 12l-5.601 5.6-1.202-1.202 3.549-3.549H3v-1.7z"></path></svg>',
};

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

/** EW4: a presentational clone must not carry the workspace index of the authored original */
function stripInstrumentation(node) {
  node.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  node.removeAttribute('data-prose-index');
  return node;
}

const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));

/** cell children, expanding a media-led <p> that the runtime folded the whole cell into */
function rowNodes(row) {
  const out = [];
  [...row.children].forEach((cell) => {
    let kids = [...cell.children];
    if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].querySelector('picture, img')
      && kids[0].children.length > 1) {
      kids = [...kids[0].children];
    }
    out.push(...kids);
  });
  return out;
}

/** card-as-link (EW6): one anchor around media + title + text, the authored inner link unwrapped */
function linkCard(prefix, nodes) {
  const media = nodes.find((n) => mediaOf(n));
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const inner = heading && heading.querySelector('a');
  const a = el('a', `${prefix}-link`);
  a.href = inner ? inner.href : '#';
  if (inner) inner.replaceWith(...inner.childNodes);
  if (media) a.append(el('div', `${prefix}-media`, media.closest('p') || media));
  if (heading) a.append(el('div', `${prefix}-title`, heading));
  nodes.filter((n) => n !== media && n !== heading).forEach((n) => a.append(el('div', `${prefix}-desc`, n)));
  return a;
}

function arrows(track) {
  const prev = el('button', 'bl-arrow');
  const next = el('button', 'bl-arrow');
  [[prev, 'Previous', -1, ARROW.prev], [next, 'Next', 1, ARROW.next]].forEach(([b, label, dir, svg]) => {
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.dataset.dir = dir;
    b.innerHTML = svg;
  });
  let index = 0;
  const go = (dir) => {
    const slides = [...track.children];
    index = Math.max(0, Math.min(slides.length - 1, index + dir));
    track.style.transform = index ? `translateX(${-slides[index].offsetLeft}px)` : '';
    slides.forEach((s, i) => {
      s.classList.toggle('slick-current', i === index);
      s.classList.toggle('slick-active', i === index);
    });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  prev.disabled = true;
  if (track.children.length < 2) next.disabled = true;
  if (track.firstElementChild) track.firstElementChild.classList.add('slick-current', 'slick-active');
  return el('div', 'bl-arrows', prev, next);
}

function subscribe(nodes) {
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const ps = nodes.filter((n) => n.tagName === 'P');
  const [text, placeholder, label, hint] = ps;
  const form = el('form', 'bl-subscribe-form');
  form.noValidate = true;
  const input = el('input');
  input.type = 'email';
  input.name = 'owner.email';
  input.required = true;
  input.setAttribute('aria-label', 'Work email');
  if (placeholder) input.placeholder = placeholder.textContent;
  const btn = el('button', 'bl-subscribe-btn');
  btn.type = 'submit';
  btn.textContent = label ? label.textContent : 'Subscribe';
  // interim D2 (dynamic-features.md): client validation only, no submit backend
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    input.reportValidity();
  });
  form.append(
    heading ? el('div', 'bl-subscribe-head', heading) : null,
    text ? el('div', 'bl-subscribe-text', text) : null,
    el('div', 'bl-subscribe-group', input, btn),
    hint ? el('div', 'bl-sr', hint) : null,
    ...ps.slice(4),
  );
  if (hint) hint.setAttribute('role', 'tooltip');
  placeholder?.remove();
  label?.remove();
  return el('div', 'bl-subscribe', form);
}

const VIDEO_RE = /(wistia\.(?:com|net)|youtube\.com|youtu\.be|vimeo\.com)/i;

function embedUrl(href) {
  let m = href.match(/wistia\.(?:com|net)\/(?:embed\/(?:iframe|medias)|medias)\/([a-z0-9]+)/i);
  if (m) return `https://fast.wistia.net/embed/iframe/${m[1]}?autoPlay=true&videoFoam=true`;
  m = href.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  m = href.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
  return null;
}

function openPlayer(src) {
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = 'Video player';
  frame.allow = 'autoplay; fullscreen';
  frame.allowFullscreen = true;
  const dialog = el('dialog', 'bl-hero-popover');
  const close = el('button', 'bl-hero-popover-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  dialog.append(close, el('div', 'bl-hero-popover-frame', frame));
  document.body.append(dialog);
  const dispose = () => { dialog.close(); dialog.remove(); };
  close.addEventListener('click', dispose);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dispose(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); dispose(); });
  dialog.showModal();
}

function searchForm(p) {
  // D9 interim: the box submits to the source marketplace search
  const form = el('form', 'bl-hero-search');
  form.action = 'https://www.zendesk.com/marketplace/apps/';
  form.method = 'get';
  const input = el('input');
  input.type = 'search';
  input.name = 'query';
  input.placeholder = p.textContent.trim();
  input.setAttribute('aria-label', p.textContent.trim());
  form.append(input);
  p.remove();
  return form;
}

/** a single-paragraph cell is delivered as bare text: give it back its <p> */
function cellKids(cell) {
  if (!cell.children.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    cell.append(p);
  }
  return [...cell.children];
}

function decorateVariant(block) {
  const copy = el('div', 'bl-hero-copy');
  const media = el('div', 'bl-hero-media');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const kids = cellKids(cell);
      if (!kids.length) return;
      const video = kids.find((n) => n.tagName === 'P' && n.querySelector('a') && VIDEO_RE.test(n.querySelector('a').href));
      if (video) {
        const a = video.querySelector('a');
        const src = embedUrl(a.href);
        a.classList.add('bl-hero-play');
        a.addEventListener('click', (e) => {
          if (!src) return;
          e.preventDefault();
          openPlayer(src);
        });
      }
      if (video || kids.some(mediaOf)) {
        kids.forEach((n) => media.append(n));
        return;
      }
      if (kids.length === 1 && kids[0].matches('ul, ol') && block.classList.contains('links')) {
        copy.append(el('div', 'bl-hero-links', kids[0]));
        return;
      }
      if (kids.length === 1 && kids[0].tagName === 'P' && !kids[0].querySelector('a')
        && block.classList.contains('hub')) {
        copy.append(searchForm(kids[0]));
        return;
      }
      kids.forEach((n) => {
        if (n.matches('ul, ol')) {
          const nav = el('nav', 'bl-crumbs', n);
          nav.setAttribute('aria-label', 'Breadcrumb');
          copy.append(nav);
        } else if (n.tagName === 'P' && n.querySelector('strong > a, em > a, a.button')) {
          const a = n.querySelector('a');
          if (!a.classList.contains('button')) a.classList.add('button', n.querySelector('em > a') ? 'secondary' : 'primary');
          copy.append(el('div', 'bl-hero-cta', n));
        } else copy.append(n);
      });
    });
  });
  // eyebrow: a heading placed before the page title (gen-B eyebrow, featured-article label)
  const heads = [...copy.querySelectorAll(':scope > h1, :scope > h2, :scope > h3')];
  if (heads.length > 1 && (block.classList.contains('legacy') || block.classList.contains('lead'))) {
    heads[0].classList.add('bl-hero-eyebrow');
  }
  block.classList.add('za-section');
  block.replaceChildren(el('div', 'za-container bl-hero-container', el(
    'div',
    'bl-hero-row',
    copy,
    media.children.length ? media : null,
  )));
}

export default function decorate(block) {
  if (['hub', 'directory', 'legacy', 'lead'].some((v) => block.classList.contains(v))) {
    decorateVariant(block);
    return;
  }
  const rows = [...block.children].map(rowNodes).filter((r) => r.length);
  const leads = [];
  const picks = [];
  let head = null;
  let sub = null;
  rows.forEach((nodes) => {
    if (nodes.some((n) => n.matches('h1') || (n.matches('h2') && !nodes.some(mediaOf)))) head = nodes;
    else if (nodes.some((n) => n.matches('h4, h5, h6')) && !nodes.some(mediaOf)) sub = nodes;
    else if (head) picks.push(nodes);
    else leads.push(nodes);
  });

  const lead = el('div', 'za-col bl-hero-lead');
  leads.forEach((nodes) => lead.append(el('div', 'bl-lead', linkCard('bl-lead', nodes))));

  const side = el('div', 'za-col bl-hero-side');
  if (head || picks.length) {
    const box = el('div', 'bl-picks');
    if (head) {
      const h = el('div', 'bl-picks-head');
      head.forEach((n) => {
        if (n.matches('h1')) {
          if (!n.querySelector('.bl-sticker')) n.append(el('span', 'bl-sticker', ...n.childNodes));
          h.append(el('div', 'bl-picks-eyebrow', n));
        } else if (/^H[2-6]$/.test(n.tagName)) h.append(el('div', 'bl-picks-title', n));
        else h.append(n);
      });
      box.append(h);
    }
    if (picks.length) {
      // the grid (>= 1150) holds the authored picks; the slider (< 1150) is a presentational
      // clone of it, instrumentation stripped (EW4) — the same two lists the source renders
      const grid = el('div', 'bl-picks-grid');
      picks.forEach((nodes) => grid.append(el('div', 'bl-pick', linkCard('bl-pick', nodes))));
      const track = el('div', 'bl-track');
      [...grid.children].forEach((pick, i) => {
        const slide = el('div', 'bl-slide', stripInstrumentation(pick.cloneNode(true)));
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', `${i + 1} of ${picks.length}`);
        track.append(slide);
      });
      const carousel = el('div', 'bl-carousel', track);
      carousel.setAttribute('role', 'region');
      carousel.setAttribute('aria-label', head?.find((n) => n.matches('h2'))?.textContent || 'Editor’s picks');
      box.append(el('div', 'bl-picks-slider', carousel, arrows(track)), grid);
    }
    side.append(box);
  }
  if (sub) side.append(subscribe(sub));

  block.classList.add('za-section');
  block.replaceChildren(
    el('div', 'bl-hero-bg'),
    el('div', 'za-container bl-hero-container', el('div', 'za-row bl-hero-row', lead, side)),
  );
}
