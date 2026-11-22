/* pricing page behaviour — only what motion-observe saw fire on the live page:
   1. FAQ accordion: single-open (opening one collapses the open one), grid-rows + padding transition (CSS).
   2. Feature buttons / "Compare all plan features" / add-on modal links open a modal (backdrop fade lbWRkT +
      modal entrance inDLdD) holding the SSR modal content that ships hidden in the page. */
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.pr-acc__item'));
  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.pr-acc__btn').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  items.forEach(function (item) {
    item.querySelector('.pr-acc__head').addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      items.forEach(function (o) { if (o !== item) setOpen(o, false); });
      setOpen(item, open);
    });
  });

  var backdrop = null, lastFocus = null;
  function close() {
    if (!backdrop) return;
    backdrop.remove(); backdrop = null; document.body.classList.remove('pr-modal-open');
    if (lastFocus) lastFocus.focus();
  }
  function open(slug, trigger) {
    var src = document.querySelector('.pr-modal[data-modal="' + slug + '"]');
    if (!src) return false;
    close(); lastFocus = trigger;
    backdrop = document.createElement('div');
    backdrop.className = 'pr-backdrop';
    backdrop.innerHTML = '<div class="pr-dialog" role="dialog" aria-modal="true" tabindex="-1"><button class="pr-dialog__close" type="button" aria-label="Close modal">' +
      '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" d="M3 13L13 3m0 10L3 3"></path></svg></button>' +
      '<div class="pr-dialog__body"></div></div>';
    var body = backdrop.querySelector('.pr-dialog__body');
    body.innerHTML = src.innerHTML;
    var h = body.querySelector('h1,h2,h3');
    if (h) { h.id = 'pr-dialog-title-' + slug; backdrop.firstChild.setAttribute('aria-labelledby', h.id); }
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
    backdrop.querySelector('.pr-dialog__close').addEventListener('click', close);
    document.body.appendChild(backdrop); document.body.classList.add('pr-modal-open');
    backdrop.firstChild.focus();
    return true;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-modal]:not(.pr-modal), a[href^="#modal."]');
    if (!t) return;
    var slug = t.getAttribute('data-modal') || t.getAttribute('href').slice(7);
    if (open(slug, t)) e.preventDefault();
  });
})();
