/**
 * hp-hero — home hero: eyebrow + h1 + lede, trial-email teaser, photo (mobile) /
 * background (>= 768), Rive animation stage with a static frame and pause control.
 *
 * Authoring rows (one cell each, classified by content, any order):
 *   copy   — <p> eyebrow, <h1> headline, <p> lede
 *   trial  — <p> note (leading <strong>), <p> placeholder (wide), <p> placeholder (narrow,
 *            optional), <p> field hint (long, shown as the field tooltip), CTA <strong><a>
 *            (the submit; its href is the trial hand-off), <p> consent (holds the privacy link)
 *   media  — the photo image, then the product fallback image (mobile)
 *   stage  — the animation's static frame image + a link to the .riv file (link text = the
 *            animation's accessible label)
 *
 * @ew-exempt <p> placeholder (trial row) — config: read into the input placeholder
 * @ew-exempt <p> animation link (stage row) — embed source: the Rive src + canvas aria-label
 */

const PAUSE_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 48 48"><path fill="currentColor" d="M22 14h-5v20h5z"></path><path fill="currentColor" d="M31 14h-5v20h5z"></path></svg>';
const PLAY_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 48 48"><path fill="currentColor" d="M17 14v20l17-10z"></path></svg>';
const NOTE_SVG = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m10.88-1.175a.5.5 0 1 0-.76-.65l-2.648 3.09-1.368-1.369a.5.5 0 1 0-.708.708l2.125 2.125 3.351-3.909z" clip-rule="evenodd"></path></svg>';
const RIVE_RUNTIME = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.52.0/rive.js';

function el(tag, className, ...kids) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...kids.filter(Boolean));
  return e;
}

const text = (n) => (n ? n.textContent.trim() : '');
const mediaOf = (n) => (n.matches('picture, img') ? n : n.querySelector('picture, img'));
// the authored unit that carries an image: its <p> when it has one, else the picture itself
const imageUnit = (m) => m.closest('p') || m.closest('picture') || m;

function collect(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    [...cell.children].forEach((c) => {
      // the runtime folds a media-led cell into one <p>: expand it back
      if (c.tagName === 'P' && c.querySelectorAll('picture, img').length > 1) {
        [...c.children].forEach((k) => out.push(k));
      } else out.push(c);
    });
  });
  return out;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.rive) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.append(s);
  });
}

/**
 * restoreAtDelivery: the Rive hero runtime, same .riv src as the source;
 * the static frame stays until it plays
 */
function mountRive(canvasBox, src, label, pauseBtn) {
  const mq = window.matchMedia('(width >= 768px)');
  let started = false;
  let instance = null;
  let playing = true;
  const start = async () => {
    if (started || !mq.matches) return;
    started = true;
    try {
      await loadScript(RIVE_RUNTIME);
      const canvas = el('canvas', 'hp-hero-rive');
      canvas.setAttribute('role', 'img');
      if (label) canvas.setAttribute('aria-label', label);
      canvasBox.prepend(canvas);
      const rect = canvasBox.getBoundingClientRect();
      canvas.width = Math.round(rect.width * (window.devicePixelRatio || 1));
      canvas.height = Math.round(rect.height * (window.devicePixelRatio || 1));
      instance = new window.rive.Rive({
        src,
        canvas,
        autoplay: true,
        stateMachines: undefined,
        layout: new window.rive.Layout({ fit: window.rive.Fit.Contain }),
        onLoad: () => {
          instance.resizeDrawingSurfaceToCanvas();
          canvasBox.classList.add('is-live');
        },
        onLoadError: () => canvas.remove(),
      });
    } catch (e) {
      // runtime or file unavailable: the static frame stays
    }
  };
  pauseBtn.addEventListener('click', () => {
    playing = !playing;
    if (instance) {
      if (playing) instance.play(); else instance.pause();
    }
    pauseBtn.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    pauseBtn.innerHTML = playing ? PAUSE_SVG : PLAY_SVG;
  });
  const kick = () => setTimeout(start, 1500);
  if (document.readyState === 'complete') kick();
  else window.addEventListener('load', kick, { once: true });
  if (mq.addEventListener) mq.addEventListener('change', start);
}

export default function decorate(block) {
  const nodes = collect(block);
  if (!nodes.length) return;

  const heads = nodes.filter((n) => /^H[1-6]$/.test(n.tagName));
  // two headings: the first is the eyebrow (the page h1, as on the source), the second the headline
  const h1 = heads.length > 1 ? heads[1] : heads[0];
  const h1i = nodes.indexOf(h1);
  const media = nodes.filter((n) => mediaOf(n));
  const units = media.map((m) => imageUnit(mediaOf(m)));
  const rivLink = nodes.map((n) => (n.matches('a') ? n : n.querySelector('a')))
    .find((a) => a && /\.riv(\?|$)/i.test(a.getAttribute('href') || ''));
  const cta = nodes.find((n) => n.querySelector && n.querySelector('a.button, strong > a'));
  const rest = nodes.filter((n) => !media.includes(n) && n !== h1
    && !(rivLink && n.contains(rivLink)) && n !== cta);

  const eyebrow = h1i > 0
    ? rest.find((n) => nodes.indexOf(n) < h1i && /^(P|H[1-6])$/.test(n.tagName)) : null;
  const afterHead = rest.filter((n) => n !== eyebrow);
  const lede = afterHead.find((n) => n.tagName === 'P' && nodes.indexOf(n) > h1i
    && !n.querySelector('strong, a') && text(n).length > 60);
  const note = afterHead.find((n) => n.tagName === 'P' && n.querySelector(':scope > strong') && !n.querySelector('a'));
  const consent = afterHead.find((n) => n.tagName === 'P' && n.querySelector('a') && n !== cta);
  const plain = afterHead.filter((n) => n.tagName === 'P' && ![lede, note, consent].includes(n));
  const placeholders = plain.filter((n) => text(n).length <= 40);
  const tip = plain.find((n) => text(n).length > 40);
  const used = [lede, note, consent, tip, ...placeholders];
  const leftovers = afterHead.filter((n) => !used.includes(n));

  // ---- copy column ----
  const copy = el('div', 'za-col hp-hero-copy');
  if (eyebrow) copy.append(el('div', 'hp-hero-eyebrow', eyebrow));
  if (h1) copy.append(el('div', 'hp-hero-title', h1));
  if (lede) copy.append(el('div', 'za-text za-text-light hp-hero-lede', lede));
  leftovers.forEach((n) => copy.append(n));

  // ---- trial teaser (D2 interim: UI + client validation, hands off to the CTA href) ----
  if (cta || note) {
    const form = el('form', 'hp-trial-form');
    form.noValidate = true;
    form.id = 'hero-trial-teaser';
    const grid = el('div', 'hp-trial-grid');
    if (note) {
      const noteBox = el('div', 'hp-trial-note');
      noteBox.innerHTML = NOTE_SVG;
      noteBox.append(note);
      grid.append(noteBox);
    }
    const fields = el('div', 'hp-trial-fields');
    const input = el('input', 'hp-trial-input');
    input.type = 'email';
    input.name = 'owner.email';
    input.id = 'hero-trial-email';
    input.autocomplete = 'email';
    input.setAttribute('aria-label', 'Work email');
    const [wide, narrow] = placeholders.map(text);
    placeholders.forEach((n) => n.remove());
    const mq = window.matchMedia('(width >= 768px)');
    const setPh = () => { input.placeholder = (mq.matches || !narrow ? wide : narrow) || ''; };
    setPh();
    if (mq.addEventListener) mq.addEventListener('change', setPh);
    const field = el('div', 'hp-trial-field', input);
    if (tip) {
      const tipBox = el('div', 'hp-trial-tip', tip);
      tipBox.setAttribute('role', 'tooltip');
      tipBox.setAttribute('aria-hidden', 'true');
      field.append(tipBox);
    }
    fields.append(field);
    // the submit: the authored CTA paragraph inside a button-styled control; its anchor is
    // unwrapped after reading the hand-off href (as the source, a control, not a link — EW6)
    let handoff = '';
    const go = (e) => {
      e.preventDefault();
      if (!input.value || !input.checkValidity()) {
        input.focus();
        input.reportValidity();
        return;
      }
      if (handoff) window.location.href = handoff;
    };
    form.addEventListener('submit', go);
    if (cta) {
      const a = cta.querySelector('a');
      if (a) {
        handoff = a.href;
        a.replaceWith(...a.childNodes);
      }
      const submit = el('div', 'za-btn za-btn-primary hp-trial-submit', cta);
      submit.setAttribute('role', 'button');
      submit.tabIndex = 0;
      fields.append(submit);
      submit.addEventListener('click', go);
      submit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); submit.click(); }
      });
    }
    grid.append(fields);
    if (consent) grid.append(el('div', 'hp-trial-consent', consent));
    form.append(grid);
    copy.append(el('div', 'hp-trial', form));
  }

  const row = el('div', 'za-row hp-hero-row', copy);
  const inner = el('div', 'za-container hp-hero-inner', row);

  // ---- media: photo (mobile in-flow, background >= 768) + product fallback ----
  const [photo, fallback, frame] = units;
  if (photo || fallback) {
    const mediaBox = el('div', 'hp-hero-media');
    if (photo) mediaBox.append(el('div', 'hp-hero-photo', photo));
    if (fallback) mediaBox.append(el('div', 'hp-hero-fallback', fallback));
    inner.append(mediaBox);
  }

  // ---- animation stage (>= 768): static frame, Rive canvas, pause control ----
  const anim = el('div', 'hp-hero-anim');
  const canvasBox = el('div', 'hp-hero-canvas');
  if (frame) canvasBox.append(el('div', 'hp-hero-frame', frame));
  const pauseBtn = el('button', 'hp-pause');
  pauseBtn.type = 'button';
  pauseBtn.setAttribute('aria-label', 'Pause animation');
  pauseBtn.innerHTML = PAUSE_SVG;
  canvasBox.append(el('div', 'hp-hero-pause', pauseBtn));
  anim.append(canvasBox);

  const rivSrc = rivLink ? rivLink.href : '';
  const rivLabel = rivLink ? text(rivLink) : '';
  if (rivLink) (rivLink.closest('p') || rivLink).remove();

  block.replaceChildren(inner, anim);
  // the .riv is served without CORS headers: the runtime mounts where the file is same-origin
  // (the source host after cut-over); elsewhere the static frame stays
  let sameOrigin = false;
  try {
    sameOrigin = new URL(rivSrc, window.location.href).origin === window.location.origin;
  } catch (e) { /* bad url */ }
  if (rivSrc && sameOrigin) mountRive(canvasBox, rivSrc, rivLabel, pauseBtn);
}
