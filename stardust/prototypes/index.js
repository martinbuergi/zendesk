/* Home (index) behaviour — only what the live page was observed doing (stardust/replica/motion/index-live.json). */

/* Testimonials: slick track (infinite, one slide shown): the last slide cloned before, every slide cloned after;
   Prev/Next/dots slide the track one viewport width per step. */
(function () {
  var track = document.querySelector('.hp-quotes__track');
  if (!track) return;
  var slides = Array.prototype.slice.call(track.querySelectorAll('.hp-quote'));
  var n = slides.length;
  if (n < 2) return;
  var clone = function (el) {
    var c = el.cloneNode(true);
    c.classList.remove('is-active'); c.classList.add('hp-quote--clone');
    c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', ''); c.removeAttribute('data-index');
    return c;
  };
  track.insertBefore(clone(slides[n - 1]), slides[0]);
  slides.forEach(function (s) { track.appendChild(clone(s)); });
  var nav = document.querySelector('.hp-quotes__nav');
  var dots = nav ? Array.prototype.slice.call(nav.querySelectorAll('.hp-dot')) : [];
  var prev = document.querySelector('button[aria-label="Previous testimonial"]');
  var next = document.querySelector('button[aria-label="Next testimonial"]');
  var live = document.querySelector('#quoteCarouselWrapper .za-sr');
  var cur = 0;
  var pos = function (i, animate) {
    track.classList.toggle('is-moving', !!animate);
    track.style.setProperty('--qi', String(i + 1));
  };
  var mark = function () {
    slides.forEach(function (s, k) {
      var on = k === cur;
      s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', String(!on));
      if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
    });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === cur); });
    if (live) live.textContent = 'Slide ' + (cur + 1) + ' of ' + n;
  };
  var go = function (i) {
    var target = i; // may be -1 or n: land on a clone, then jump back without animation
    cur = (i + n) % n;
    mark();
    pos(target, true);
    var done = function () {
      track.removeEventListener('transitionend', done);
      if (target !== cur) pos(cur, false);
      else track.classList.remove('is-moving');
    };
    track.addEventListener('transitionend', done);
  };
  pos(0, false);
  if (prev) prev.addEventListener('click', function () { go(cur - 1); });
  if (next) next.addEventListener('click', function () { go(cur + 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
})();

/* Sections get `active` on first entering the viewport (live: class added per section on scroll). */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('main > section').forEach(function (s) { io.observe(s); });
})();

/* Hero trial teaser: the live component swaps the email placeholder by viewport (mobile: name@company.com). */
(function () {
  var input = document.getElementById('hero-trial-email');
  if (!input) return;
  var mq = window.matchMedia('(min-width: 768px)');
  var set = function () { input.placeholder = mq.matches ? 'Enter work email' : 'name@company.com'; };
  set(); if (mq.addEventListener) mq.addEventListener('change', set);
})();
