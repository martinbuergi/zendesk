/**
 * sv-hero — program-page hero (gen A teaser): eyebrow, h1, lede, CTAs or a
 * free-trial email form, and a media column (image, optionally a Wistia video).
 * Schema: stardust/eds-schema/service.json section 0 (#teaser-a23e38d452).
 *
 * Authoring (one row, two cells; a single flattened cell also works):
 *   cell 1 (text): eyebrow <p> (before the heading), <h1>, lede <p>(s),
 *     CTA <p>s (<strong><a> primary, <em><a> secondary).
 *     Variant `trial`: the paragraph led by <strong> is the trial note, the first
 *     CTA is the form's submit (label = its text, its href receives ?email=), a link-free <p> after
 *     the CTA is the email hint, a link-bearing <p> after it the privacy notice.
 *   cell 2 (media): <picture>.
 *   Video: a Wistia link on its own line as default content right AFTER the block
 *     (<p><a href="https://fast.wistia.net/embed/iframe/izivwbhm2u">Play video</a></p>, D1) turns
 *     the image into a poster with a play button opening the Wistia popover (same media id).
 *
 * Program-sibling variants: `reverse` media first at >= 768 (natural-ratio video); `small` h2-size
 *   heading; `landscape` 4:3 media box; `bg-video` the media cell's .mp4 plays as the full-bleed
 *   band background; a picture authored before the heading is the eyebrow (a lockup image).
 * @variants block: trial (default none) — free-trial email form instead of CTA buttons;
 *   notice (default none) — closed-notice page: single lead group, full-width CTA below 768
 * @ew-exempt input placeholder / aria-label "Work email" — runtime form UI
 */

const SVG_CHECK = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m10.88-1.175a.5.5 0 1 0-.76-.65l-2.648 3.09-1.368-1.369a.5.5 0 1 0-.708.708l2.132 2.131z" clip-rule="evenodd"></path></svg>';
const SVG_EXT = '<svg class="sv-ext" role="img" aria-label="(opens in a new tab)" focusable="false" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="none" stroke="currentColor" stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>';
const SVG_PLAY = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 48 48" style="padding-left: 2px;"><path fill="currentColor" d="M36 24 15 13v22z"></path></svg>';
const SVG_CLOSE = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="m5 5 14 14M19 5 5 19"></path></svg>';

function el(tag, className, html) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html) n.innerHTML = html;
  return n;
}

function wrapNode(node, className) {
  const w = el('div', className);
  w.append(node);
  return w;
}

// collect the authored elements of every cell (expanding the runtime's media-led <p> fold, #104)
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    let kids = [...cell.children];
    if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].querySelector('picture, img')
      && kids[0].textContent.trim()) {
      kids = [...kids[0].childNodes].map((n) => {
        if (n.nodeType === 1) return n;
        // HARNESS-ONLY fallback (EW5): wrap a stray text node, never copy it
        if (n.textContent.trim()) { const p = document.createElement('p'); p.append(n); return p; }
        return null;
      }).filter(Boolean);
    }
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      // HARNESS-ONLY fallback (EW5)
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      out.push(p);
    }
  });
  return out;
}

const isHeading = (n) => /^H[1-6]$/.test(n.tagName);
const isMedia = (n) => n.matches('picture, img') || (!!n.querySelector('picture, img') && !n.textContent.trim());
const videoLink = (n) => (n.matches('a') ? n : n.querySelector('a[href*="wistia"]'));
const isCta = (n) => !!n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();

function wistiaId(href) {
  const m = /(?:medias|iframe|wvideo=|wistia:)\/?([a-z0-9]{6,})/i.exec(href || '');
  return m ? m[1] : '';
}

function openVideo(id) {
  const dlg = el('dialog', 'sv-hero-popover');
  dlg.setAttribute('aria-label', 'Video');
  const close = el('button', 'sv-hero-popover-close', SVG_CLOSE);
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  const frame = el('div', 'sv-hero-popover-frame');
  const iframe = document.createElement('iframe');
  iframe.src = `https://fast.wistia.net/embed/iframe/${id}?autoPlay=true&videoFoam=true`;
  iframe.title = 'Video';
  iframe.allow = 'autoplay; fullscreen';
  iframe.allowFullscreen = true;
  frame.append(iframe);
  dlg.append(close, frame);
  document.body.append(dlg);
  const done = () => dlg.remove();
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', done);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.showModal();
}

function buildTrial(nodes, ctaIdx) {
  const form = el('form', 'sv-trial');
  form.noValidate = true;
  form.action = '#';
  const grid = el('div', 'sv-trial-grid');
  const before = nodes.slice(0, ctaIdx);
  const after = nodes.slice(ctaIdx + 1);
  const cta = nodes[ctaIdx];
  const note = before.find((n) => n.tagName === 'P' && n.firstElementChild && n.firstElementChild.tagName === 'STRONG');
  if (note) {
    note.prepend(el('span', 'sv-trial-check', SVG_CHECK));
    grid.append(wrapNode(note, 'sv-trial-note'));
  }
  const fields = el('div', 'sv-trial-fields');
  const field = el('div', 'sv-trial-field');
  const input = el('input', 'sv-input');
  input.type = 'email';
  input.name = 'owner.email';
  input.id = 'sv-trial-email';
  input.required = true;
  input.autocomplete = 'email';
  input.setAttribute('aria-label', 'Work email');
  input.placeholder = 'name@company.com';
  field.append(input);
  const hint = after.find((n) => n.tagName === 'P' && !n.querySelector('a'));
  if (hint) {
    const tip = wrapNode(hint, 'sv-tip');
    tip.id = 'sv-trial-email-tip';
    tip.setAttribute('role', 'tooltip');
    input.setAttribute('aria-describedby', tip.id);
    field.append(tip);
  }
  // the submit control is the authored CTA paragraph: its link's href is read, then the
  // anchor is unwrapped (EW6) so the label reads as the button text, as on live
  const link = cta.querySelector('a');
  const target = link ? link.href : '';
  if (link) link.replaceWith(...link.childNodes);
  const btn = wrapNode(cta, 'za-btn za-btn-primary sv-trial-btn');
  btn.setAttribute('role', 'button');
  btn.tabIndex = 0;
  fields.append(field, wrapNode(btn, 'sv-trial-cta'));
  grid.append(fields);
  const more = el('div', 'sv-trial-more');
  after.filter((n) => n !== hint).forEach((n) => {
    n.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      if (a.title === a.textContent) a.removeAttribute('title');
      if (!a.querySelector('.sv-ext')) a.insertAdjacentHTML('beforeend', SVG_EXT);
    });
    more.append(wrapNode(n, 'sv-small'));
  });
  if (more.children.length) grid.append(more);
  form.append(grid);

  const submit = (e) => {
    e.preventDefault();
    if (!input.value || !input.checkValidity()) {
      input.setCustomValidity(input.value ? '' : 'Please enter your work email');
      input.reportValidity();
      input.setCustomValidity('');
      input.focus();
      return;
    }
    // D2 interim: hand the email off to the source trial sign-up (nothing captured here)
    const url = new URL(target || 'https://www.zendesk.com/register/', window.location.href);
    url.searchParams.set('email', input.value);
    window.location.assign(url.href);
  };
  form.addEventListener('submit', submit);
  btn.addEventListener('click', submit);
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') submit(e);
  });
  input.addEventListener('focus', () => more.classList.add('expanded'));
  return form;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .sv-hero-glow')) return;
  const trial = block.classList.contains('trial');
  // variant `logos`: row 2 = strip heading, rows 3+ = one logo each (moved, EW1)
  const extraRows = [...block.children].slice(1);
  let strip = null;
  if (extraRows.length) {
    strip = el('div', 'sv-hero-logos');
    const list = el('div', 'sv-hero-logo-list');
    extraRows.forEach((r, i) => {
      const kids = [...r.querySelectorAll(':scope > div > *')];
      if (i === 0 && !kids.some((k) => k.querySelector('img, picture'))) kids.forEach((k) => strip.append(wrapNode(k, 'sv-hero-logos-h')));
      else kids.forEach((k) => list.append(wrapNode(k, 'sv-hero-logo')));
      r.remove();
    });
    strip.append(list);
  }
  const nodes = collectNodes(block);
  // D1: the video URL is authored as default content right after the block (a plain link
  // on its own line); the hero adopts it as the poster's play control
  const after = block.parentElement && block.parentElement.nextElementSibling;
  if (after && after.classList.contains('default-content-wrapper')) {
    const vp = [...after.children].find((n) => n.tagName === 'P' && n.querySelector('a[href*="wistia"]'));
    if (vp) {
      nodes.push(vp);
      if (after.children.length === 1) after.remove();
    }
  }
  const heading = nodes.find((n) => n.tagName === 'H1') || nodes.find(isHeading);
  // the poster's play control: the link authored after the block (else the first wistia link);
  // a wistia link styled as a CTA (<em>/<strong>) stays a CTA that opens the same popover
  const ctaVideo = (n) => n.matches('p') && n.querySelector('a[href*="wistia"]') && n.querySelector('strong, em, a.button');
  const vlink = nodes.filter((n) => !ctaVideo(n)).map((n) => (n.matches('a, p') ? videoLink(n) : null)).find(Boolean);
  // an authored .mp4 link in the media cell becomes a muted looping video (live autoplay hero)
  const mp4 = nodes.find((n) => n.matches('p') && n.querySelector('a[href$=".mp4"], a[href*="/is/content/"]') && !n.querySelector('strong, em, a.button'));
  const vpar = vlink ? (vlink.closest('p') || vlink) : null;
  // a picture before the heading is the eyebrow (live CX Trends lockup above the h1), not media
  const hPos = heading ? nodes.indexOf(heading) : -1;
  const eyebrowMedia = hPos > 0 ? nodes.slice(0, hPos).filter(isMedia) : [];
  const media = nodes.filter((n) => n !== vpar && isMedia(n) && !eyebrowMedia.includes(n));
  const textNodes = nodes.filter((n) => n !== vpar && n !== mp4 && !media.includes(n));
  let bgVideo = null;
  if (mp4) {
    const a = mp4.querySelector('a');
    const v = document.createElement('video');
    v.src = a.href;
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('aria-label', a.textContent.trim());
    const vw = el('div', 'sv-hero-mp4');
    vw.append(v);
    a.replaceWith(vw);
    mp4.replaceWith(...mp4.childNodes);
    // variant `bg-video`: the video is the band's full-bleed background (live /cxtrends/)
    if (block.classList.contains('bg-video')) bgVideo = vw;
    else media.push(vw);
  }

  const glow = el('div', 'sv-hero-glow');
  if (bgVideo) glow.append(bgVideo);
  const container = el('div', 'za-container sv-rel');
  const row = el('div', 'za-row sv-hero-row');
  const text = el('div', 'za-col sv-hero-text');
  const mediaCol = el('div', 'za-col sv-hero-media');

  const hIdx = heading ? textNodes.indexOf(heading) : -1;
  textNodes.slice(0, Math.max(hIdx, 0)).forEach((n) => text.append(wrapNode(n, 'za-eyebrow')));
  if (heading) text.append(heading);
  const rest = textNodes.slice(hIdx + 1);
  const ctaIdx = rest.findIndex(isCta);
  if (trial && ctaIdx >= 0) {
    rest.slice(0, ctaIdx).forEach((n) => {
      if (n.tagName === 'P' && n.firstElementChild && n.firstElementChild.tagName === 'STRONG') return;
      text.append(wrapNode(n, 'za-text sv-lead'));
    });
    text.append(buildTrial(rest, ctaIdx));
  } else {
    const ctas = el('div', 'sv-hero-ctas');
    rest.forEach((n) => {
      if (isCta(n)) ctas.append(n);
      else text.append(wrapNode(n, 'za-text sv-lead'));
    });
    if (ctas.children.length) text.append(ctas);
  }

  if (media.length || vpar) {
    const id = vlink ? wistiaId(vlink.href) : '';
    if (id) {
      const video = el('div', 'sv-video');
      video.dataset.video = `wistia:${id}`;
      media.forEach((m) => video.append(m));
      const play = wrapNode(vpar, 'sv-play');
      if (!vlink.querySelector('.za-sr')) {
        const sr = el('span', 'za-sr');
        sr.append(...vlink.childNodes);
        vlink.append(sr);
      }
      vlink.insertAdjacentHTML('afterbegin', SVG_PLAY);
      if (vlink.title === vlink.textContent) vlink.removeAttribute('title');
      video.append(play);
      video.addEventListener('click', (e) => {
        e.preventDefault();
        openVideo(id);
      });
      mediaCol.append(video);
    } else {
      media.forEach((m) => mediaCol.append(wrapNode(m, 'sv-hero-img')));
      if (vpar) mediaCol.append(vpar);
    }
  }

  text.querySelectorAll('.sv-hero-ctas a[href*="wistia"]').forEach((a) => {
    const id = wistiaId(a.href);
    if (id) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openVideo(id);
      });
    }
  });
  row.append(text);
  if (mediaCol.children.length) row.append(mediaCol);
  else block.classList.add('sv-hero-no-media');
  container.append(row);
  if (strip) container.append(strip);
  block.classList.add('za-section');
  block.replaceChildren(glow, container);
}
