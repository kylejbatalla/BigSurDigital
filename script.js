// Mobile menu
document.getElementById('menuToggle').addEventListener('click', function () {
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(function (a) {
  a.addEventListener('click', function () {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Hero video: maximize autoplay reliability on mobile.
// (Markup already has autoplay/muted/playsinline; this recovers cases where the
//  browser defers autoplay. It cannot override iOS Low Power Mode, which blocks autoplay by design.)
(function () {
  var v = document.querySelector('.hero-video');
  if (!v) return;
  v.muted = true;            // muted PROPERTY must be true for mobile autoplay
  v.setAttribute('muted', '');
  v.playsInline = true;
  function tryPlay() {
    var p = v.play();
    if (p && typeof p.catch === 'function') { p.catch(function () {}); }
  }
  tryPlay();
  v.addEventListener('canplay', tryPlay, { once: true });
  // First user gesture is allowed to start playback even when autoplay was blocked
  ['touchstart', 'click', 'scroll'].forEach(function (evt) {
    document.addEventListener(evt, tryPlay, { once: true, passive: true });
  });
})();

// Transparent nav over the hero: hide brand + white background while the hero
// is behind the header; restore solid nav once the user scrolls past it.
(function () {
  var header = document.querySelector('header');
  var hero = document.querySelector('.hero');
  if (!header || !hero) return;
  header.classList.add('hero-mode'); // hero is in view on load

  function headerHeight() { return header.offsetHeight || 80; }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        header.classList.toggle('hero-mode', entry.isIntersecting);
      });
    }, { rootMargin: '-' + headerHeight() + 'px 0px 0px 0px', threshold: 0 });
    observer.observe(hero);
  } else {
    // Fallback: toggle based on scroll position vs hero height
    window.addEventListener('scroll', function () {
      var past = window.scrollY > (hero.offsetHeight - headerHeight());
      header.classList.toggle('hero-mode', !past);
    }, { passive: true });
  }
})();

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Form (front-end demo — wire up to email/backend service when ready)
function handleSubmit(e) {
  e.preventDefault();
  document.getElementById('quoteForm').reset();
  return false;
}

// Drop-in animation: reveal each major section as it scrolls into view
(function () {
  var sections = document.querySelectorAll('main > section, body > section');
  sections.forEach(function (s) { s.classList.add('drop-in'); });
  // Reveal whole sections plus any element pre-marked with .drop-in (e.g. credentials list)
  var revealEls = document.querySelectorAll('.drop-in');
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(function (s) { s.classList.add('in-view'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  revealEls.forEach(function (s) { observer.observe(s); });
})();
