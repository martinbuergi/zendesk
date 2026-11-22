/* contact: lead-form UI (interim tier, dynamic-features.md D2) — required-field validation as the live
   Garden form renders it ("This field is required"), no submit backend. */
(function () {
  var form = document.getElementById('contact-us-form');
  if (!form) return;
  var REQUIRED = ['owner.email', 'FirstName', 'LastName'];
  function setError(input, on) {
    var wrap = input.closest('.ct-wrapper');
    var msg = wrap.parentNode.querySelector('.ct-msg');
    input.setAttribute('aria-invalid', on ? 'true' : 'false');
    if (on && !msg) {
      msg = document.createElement('div');
      msg.className = 'ct-msg'; msg.id = input.id + '--message'; msg.textContent = 'This field is required';
      wrap.parentNode.insertBefore(msg, wrap.nextSibling);
      input.setAttribute('aria-describedby', msg.id);
    } else if (!on && msg) { msg.remove(); input.removeAttribute('aria-describedby'); }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    /* live: the form takes .ymIyT (opacity .6, pointer-events none) while it validates, then the errors render */
    form.classList.add('is-loading');
    setTimeout(function () { form.classList.remove('is-loading'); validate(); }, 300);
  });
  function validate() {
    var first = null;
    REQUIRED.forEach(function (n) {
      var el = form.elements[n]; var bad = !el.value.trim();
      setError(el, bad); if (bad && !first) first = el;
    });
    var status = form.querySelector('.ct-status');
    if (first) { status.hidden = true; first.focus(); return; }
    status.textContent = 'Thanks! This preview has no form backend connected, so nothing was sent.';
    status.hidden = false;
  }
  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) setError(e.target, false);
  });
})();
