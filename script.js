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

// Quote form — POST submission to the Cloudflare Worker endpoint.
// Config (endpoint + reCAPTCHA site key) comes from config.js.
var CFG = window.SITE_CONFIG || {};
var QUOTE_ENDPOINT = CFG.QUOTE_ENDPOINT;
var RECAPTCHA_SITE_KEY = CFG.RECAPTCHA_SITE_KEY;

// Load Google reCAPTCHA v3 (invisible — no puzzle, score-based).
// Only loads if a real site key is configured.
if (RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_V3_SITE_KEY') {
  var rc = document.createElement('script');
  rc.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(RECAPTCHA_SITE_KEY);
  rc.async = true;
  rc.defer = true;
  document.head.appendChild(rc);
}

function handleSubmit(e) {
  e.preventDefault();

  var form = document.getElementById('quoteForm');
  var btn = form.querySelector('button[type="submit"]');

  // Status message element (created once, reused thereafter)
  var status = document.getElementById('quoteStatus');
  if (!status) {
    status = document.createElement('p');
    status.id = 'quoteStatus';
    status.setAttribute('role', 'status');
    status.style.marginTop = '0.75rem';
    form.appendChild(status);
  }

  var payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    interest: form.interest.value,
    message: form.message.value.trim()
  };

  var originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  status.textContent = '';
  status.style.color = '';

  function fail(msg) {
    status.style.color = '#c0392b';
    status.textContent = msg || 'Sorry, something went wrong sending your message. Please try again or email directly.';
    btn.disabled = false;
    btn.textContent = originalLabel;
  }

  function send() {
    fetch(QUOTE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed with status ' + res.status);
        return res.text();
      })
      .then(function () {
        form.reset();
        status.style.color = '#1a7f37';
        status.textContent = 'Thanks! Your message has been sent — I\'ll be in touch soon.';
        btn.disabled = false;
        btn.textContent = originalLabel;
      })
      .catch(function () { fail(); });
  }

  // Get a fresh reCAPTCHA v3 token, then send. If reCAPTCHA isn't
  // available (not configured / failed to load), send without it
  // and let the Worker decide how strict to be.
  if (window.grecaptcha && RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_V3_SITE_KEY') {
    grecaptcha.ready(function () {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'quote' })
        .then(function (token) {
          payload.recaptchaToken = token;
          send();
        })
        .catch(function () { fail('Could not verify you are human. Please reload and try again.'); });
    });
  } else {
    send();
  }

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
