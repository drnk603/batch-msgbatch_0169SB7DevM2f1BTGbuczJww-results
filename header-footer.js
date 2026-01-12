(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var toggle = header.querySelector('.dr-nav-toggle');
  var nav = header.querySelector('.dr-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
})();