/* service page behaviour: benefits accordion (one open, swaps the media), customer-stories carousel,
   resources carousel, free-trial privacy notice reveal. Minimal, no framework. */
(function () {
  // benefits accordion + media
  var acc = document.querySelector('.sv-acc');
  if (acc) {
    var items = Array.prototype.slice.call(acc.querySelectorAll('.sv-acc__item'));
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.sv-accm__img'));
    items.forEach(function (item, i) {
      item.querySelector('.sv-acc__head').addEventListener('click', function () {
        if (item.classList.contains('is-open')) return;
        items.forEach(function (it, j) {
          var open = j === i;
          it.classList.toggle('is-open', open);
          it.querySelector('.sv-acc__btn').setAttribute('aria-expanded', String(open));
          var p = it.querySelector('.sv-acc__panel');
          p.setAttribute('aria-hidden', String(!open));
          if (open) p.removeAttribute('inert'); else p.setAttribute('inert', '');
        });
        imgs.forEach(function (m, j) { m.classList.toggle('is-active', j === i); });
      });
    });
  }

  // customer stories
  var q = document.getElementById('quoteCarouselWrapper');
  if (q) {
    var slides = Array.prototype.slice.call(q.querySelectorAll('.sv-quotes__slide'));
    var dots = Array.prototype.slice.call(q.querySelectorAll('.sv-dot'));
    var tabs = Array.prototype.slice.call(q.querySelectorAll('.sv-logo-tab'));
    var cur = 0;
    var qTrack = q.querySelector('.sv-quotes__track');
    var timer = null;
    var schedule = function () {
      clearTimeout(timer);
      if (!q.classList.contains('is-playing')) return;
      timer = setTimeout(function () { show(cur + 1); }, 10000);
    };
    var show = function (n) {
      cur = (n + slides.length) % slides.length;
      qTrack.style.transform = 'translateX(' + (-100 * cur) + '%)';
      slides.forEach(function (s, j) { s.classList.toggle('is-active', j === cur); s.setAttribute('aria-hidden', String(j !== cur)); });
      dots.forEach(function (d, j) { d.classList.toggle('is-active', j === cur); });
      tabs.forEach(function (t, j) { t.classList.toggle('is-active', j === cur); });
      schedule();
    };
    // autoplay: the live tabs run a 10 s progress bar while the carousel is in view, then advance
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          q.classList.toggle('is-playing', e.isIntersecting);
          if (e.isIntersecting) schedule(); else clearTimeout(timer);
        });
      }, { threshold: 0.5 }).observe(q);
    }
    q.querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () { show(cur + Number(b.getAttribute('data-dir'))); });
    });
    dots.concat(tabs).forEach(function (b) {
      b.addEventListener('click', function () { show(Number(b.getAttribute('data-index'))); });
    });
  }

  // additional resources
  var res = document.querySelector('.sv-res');
  if (res) {
    var track = res.querySelector('.sv-res__track');
    var rs = Array.prototype.slice.call(track.children);
    var prev = res.querySelector('[data-dir="-1"]');
    var next = res.querySelector('[data-dir="1"]');
    var idx = 0;
    var maxIdx = function () {
      var w = res.querySelector('.sv-res__list').clientWidth;
      var step = rs[1] ? rs[1].offsetLeft - rs[0].offsetLeft : w;
      return Math.max(0, Math.ceil((rs.length * step - w) / step));
    };
    var go = function (n) {
      idx = Math.max(0, Math.min(n, maxIdx()));
      var step = rs[1] ? rs[1].offsetLeft - rs[0].offsetLeft : 0;
      track.style.transform = 'translateX(' + (-idx * step) + 'px)';
      prev.disabled = idx === 0; next.disabled = idx >= maxIdx();
    };
    // slick ignores clicks while the 500 ms slide transition runs
    var busy = false;
    var step1 = function (d) { if (busy) return; busy = true; setTimeout(function () { busy = false; }, 500); go(idx + d); };
    prev.addEventListener('click', function () { step1(-1); });
    next.addEventListener('click', function () { step1(1); });
  }

  // free-trial: reveal the privacy notice once the email field is used
  var input = document.querySelector('.sv-trial .sv-input');
  if (input) {
    input.addEventListener('focus', function () { document.querySelector('.sv-trial__more').classList.add('expanded'); });
  }
})();
