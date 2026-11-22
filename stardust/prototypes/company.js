/* company (static archetype): locations carousel (slick, slidesToShow 4 / 1.33, no loop, 500 ms). Minimal, no framework. */
(function () {
  var car = document.querySelector('.co-car');
  if (!car) return;
  var track = car.querySelector('.co-car__track');
  var slides = Array.prototype.slice.call(track.children);
  var prev = car.querySelector('[data-dir="-1"]');
  var next = car.querySelector('[data-dir="1"]');
  var idx = 0;
  var show = function () { return parseFloat(getComputedStyle(track).getPropertyValue('--co-show')) || 1; };
  // slick translates by its own slide width, ceil(list / show) px, ignoring the flex gap (live travel 276 px at 1440)
  var step = function () { return Math.ceil(car.querySelector('.co-car__list').clientWidth / show()); };
  var maxIdx = function () { return Math.max(0, Math.ceil(slides.length - show())); };
  var go = function (n) {
    idx = Math.max(0, Math.min(n, maxIdx()));
    track.style.transform = 'translateX(' + (-idx * step()) + 'px)';
    prev.disabled = idx === 0; next.disabled = idx >= maxIdx();
    // slick state classes (no paint of their own): current = first shown, active = the shown window
    var n = Math.ceil(show());
    slides.forEach(function (s, i) { s.classList.toggle("slick-current", i === idx); s.classList.toggle("slick-active", i >= idx && i < idx + n); });
  };
  // slick ignores clicks while the 500 ms slide transition runs
  var busy = false;
  var move = function (d) { if (busy) return; busy = true; setTimeout(function () { busy = false; }, 500); go(idx + d); };
  prev.addEventListener('click', function () { move(-1); });
  next.addEventListener('click', function () { move(1); });
  window.addEventListener('resize', function () { go(idx); });
  go(0);
})();
