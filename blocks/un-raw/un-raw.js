/**
 * un-raw — `unique` template: a non-HTML source page served as bare text (live
 * /blog-ads-api-output/: a JSON feed the browser paints as unstyled body text, no chrome).
 * Authoring: one row, one cell: the feed text verbatim in <p>(s). The block only adds a class
 * hook; the authored paragraphs stay in place.
 */

export default function decorate(block) {
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    cell.classList.add('un-raw-text');
  });
}
