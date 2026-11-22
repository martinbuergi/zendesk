/* Gen-A canon behaviour (minimal, no framework): promo dismiss, footer/section accordions. */
(function () {
  document.querySelectorAll('.za-promo__close').forEach(function (b) {
    b.addEventListener('click', function () { var p = b.closest('.za-promo'); if (p) p.hidden = true; });
  });
  document.querySelectorAll('.za-acc__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.closest('.za-acc__item'); var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
    });
  });
})();

/* Gen-A header stuck state (live kOPZoh): once the sticky desktop/mobile bar pins, .is-stuck swaps the logo to the wordmark. */
(function () {
  var bars = document.querySelectorAll('.za-hdr');
  if (!bars.length) return;
  var tick = function () {
    bars.forEach(function (h) {
      var top = parseFloat(getComputedStyle(h).top) || 0;
      var stuck = window.scrollY > 0 && h.getBoundingClientRect().top <= top + 0.5;
      h.classList.toggle('is-stuck', stuck);
    });
  };
  window.addEventListener('scroll', tick, { passive: true }); tick();
})();
