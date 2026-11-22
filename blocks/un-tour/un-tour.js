/**
 * un-tour — `unique` template: the live /intro-tour/ tour section (legacy p-intro-tour): a white
 * page bar (logo left, Replay link + trial CTA right) over a grey stage holding the framed 16:9
 * guided-tour iframe (embed-passthrough: the iframe keeps the authored src).
 *
 * Authoring:
 *   row 1: cell 1 logo <p><a href="/"><img alt="Zendesk"></a></p>;
 *          cell 2 links: <p><a href="#">Replay</a></p> (plain link: reloads the tour),
 *          <p><strong><a>Start a trial</a></strong></p> (CTA).
 *   row 2: one cell: <p><a href="https://app.getreprise.com/launch/…">Intro Tour</a></p>
 *          — the link text becomes the iframe title.
 * @ew-exempt link (row 2) — embed source URL, rendered as the iframe (title from its text)
 */

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

export default function decorate(block) {
  if (block.querySelector('.un-tour-bar')) return;
  const rows = [...block.children];
  const cells = rows.map((r) => [...r.children]);
  const barRow = cells[0] || [];
  const embedRow = rows.length > 1 ? rows[rows.length - 1] : null;

  const bar = el('div', 'un-tour-bar');
  const inner = el('div', 'un-tour-inner');
  const logo = el('div', 'un-tour-logo');
  const acts = el('div', 'un-tour-acts');
  if (barRow[0]) logo.append(...barRow[0].childNodes);
  barRow.slice(1).forEach((c) => acts.append(...c.childNodes));
  inner.append(logo, acts);
  bar.append(inner);

  const stage = el('div', 'un-tour-stage');
  const frame = el('div', 'un-tour-frame');
  stage.append(frame);
  const a = embedRow?.querySelector('a[href]');
  let iframe;
  if (a) {
    iframe = el('iframe');
    iframe.id = 'tour-container';
    iframe.src = a.href;
    iframe.title = a.textContent.trim() || 'Embedded content';
    frame.append(iframe);
  }

  acts.querySelectorAll('a[href="#"]:not(.button)').forEach((link) => {
    link.classList.add('un-tour-replay');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (iframe) iframe.src = iframe.src.toString();
    });
  });

  block.replaceChildren(bar, stage);
}
