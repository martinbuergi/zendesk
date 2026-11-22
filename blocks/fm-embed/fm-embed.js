/**
 * fm-embed — form-template page embed (live /demo/: the Storylane demo hub behind the lead
 * dialog, embed-passthrough per stardust/dynamic-features.md — the iframe keeps the authored src).
 * Authoring: one row, one cell: <p><a href="https://…">Title</a></p> — the link text becomes the
 * iframe title.
 * @ew-exempt link (cell 1) — embed source URL, rendered as the iframe (title from its text)
 */

export default function decorate(block) {
  if (block.querySelector('iframe')) return;
  const a = block.querySelector('a[href]');
  if (!a) return;
  const frame = document.createElement('div');
  frame.className = 'fm-embed-frame';
  const iframe = document.createElement('iframe');
  iframe.src = a.href;
  iframe.title = a.textContent.trim() || 'Embedded content';
  iframe.name = 'sl-embed';
  iframe.allow = 'fullscreen';
  iframe.setAttribute('allowfullscreen', '');
  frame.append(iframe);
  block.replaceChildren(frame);
}
