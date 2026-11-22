/* Blog listing: slick-style carousels (editor's picks + category groups) — Prev/Next move the track one slide. */
(function () {
  document.querySelectorAll('.bl-arrows').forEach(function (nav) {
    var carousel = nav.previousElementSibling;
    var track = carousel && carousel.querySelector('.bl-track');
    if (!track) return;
    var index = 0;
    var go = function (dir) {
      var slides = track.children;
      index = Math.max(0, Math.min(slides.length - 1, index + dir));
      track.style.transform = index ? 'translateX(' + (-slides[index].offsetLeft) + 'px)' : '';
      for (var i = 0; i < slides.length; i++) { slides[i].classList.toggle('slick-current', i === index); slides[i].classList.toggle('slick-active', i === index); }
      nav.querySelectorAll('.bl-arrow').forEach(function (b) {
        var d = Number(b.getAttribute('data-dir'));
        b.disabled = d < 0 ? index === 0 : index === slides.length - 1;
      });
    };
    nav.querySelectorAll('.bl-arrow').forEach(function (b) {
      b.addEventListener('click', function () { go(Number(b.getAttribute('data-dir'))); });
    });
  });
})();

/* /blog/: the global header is not sticky here, so it never takes canon-a.js's stuck state (runs after canon's scroll handler). */
(function () {
  var bars = document.querySelectorAll('.bl-root .za-hdr');
  var clear = function () { bars.forEach(function (h) { h.classList.remove('is-stuck'); }); };
  window.addEventListener('scroll', clear, { passive: true }); clear();
})();

/* sections gain 'active' on entering the viewport (live behaviour; no visual rule depends on it). */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
  });
  document.querySelectorAll('.bl-root > section').forEach(function (s) { io.observe(s); });
})();
