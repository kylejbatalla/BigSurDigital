// Mobile menu
document.getElementById('menuToggle').addEventListener('click', function () {
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(function (a) {
  a.addEventListener('click', function () {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Transparent nav over the hero; solid glass nav once scrolled past it.
(function () {
  var header = document.querySelector('header');
  var hero = document.querySelector('.hero');
  if (!header || !hero) return;
  header.classList.add('hero-mode');

  function headerHeight() { return header.offsetHeight || 80; }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        header.classList.toggle('hero-mode', entry.isIntersecting);
      });
    }, { rootMargin: '-' + headerHeight() + 'px 0px 0px 0px', threshold: 0 });
    observer.observe(hero);
  } else {
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

// Load Google reCAPTCHA v3 (invisible — no puzzle, score-based) lazily:
// only when the user first interacts with the quote form, so its script
// stays off the initial page load entirely.
(function () {
  if (!RECAPTCHA_SITE_KEY || RECAPTCHA_SITE_KEY === 'YOUR_RECAPTCHA_V3_SITE_KEY') return;
  var form = document.getElementById('quoteForm');
  if (!form) return;
  var loaded = false;
  function loadRecaptcha() {
    if (loaded) return;
    loaded = true;
    var rc = document.createElement('script');
    rc.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(RECAPTCHA_SITE_KEY);
    rc.async = true;
    rc.defer = true;
    document.head.appendChild(rc);
  }
  ['focusin', 'mouseenter', 'touchstart'].forEach(function (evt) {
    form.addEventListener(evt, loadRecaptcha, { once: true, passive: true });
  });
})();

function handleSubmit(e) {
  e.preventDefault();

  var form = document.getElementById('quoteForm');
  var btn = form.querySelector('button[type="submit"]');

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
    status.style.color = '#ff8a8a';
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
        status.style.color = '#5fd598';
        status.textContent = 'Thanks! Your message has been sent — I\'ll be in touch soon.';
        btn.disabled = false;
        btn.textContent = originalLabel;
      })
      .catch(function () { fail(); });
  }

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

// Respect user preference for reduced motion across all JS-driven effects
var REDUCED_MOTION = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll reveal: sections, staggered grids, and any pre-marked elements
(function () {
  var revealEls = document.querySelectorAll('.reveal, .stagger, .drop-in');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(function (el) { observer.observe(el); });
})();

// Hero parallax: content drifts up and fades as you scroll (Apple-style).
// Skipped on small screens — the downward drift would push the laptop
// under the next section and clip it.
(function () {
  if (REDUCED_MOTION) return;
  var hero = document.querySelector('.hero');
  var layout = document.querySelector('.hero-layout');
  var cue = document.querySelector('.scroll-cue');
  if (!hero || !layout) return;
  var ticking = false;
  function update() {
    if (window.innerWidth < 860) {
      layout.style.transform = '';
      layout.style.opacity = '';
      if (cue) cue.style.opacity = '';
      ticking = false;
      return;
    }
    var h = hero.offsetHeight || 1;
    var y = window.scrollY;
    var progress = Math.min(y / (h * 0.85), 1);
    layout.style.transform = 'translateY(' + (y * 0.28) + 'px)';
    layout.style.opacity = String(1 - progress * 1.1);
    if (cue) cue.style.opacity = String(Math.max(0, 1 - progress * 3));
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();

// Count-up animation for stats (e.g. the 75% "Did You Know" figure)
(function () {
  var counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) return; // keep static text

  function animate(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var suffix = /%/.test(el.textContent) ? '%' : '';
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4); // ease-out quart
      el.textContent = Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(function (el) { observer.observe(el); });
})();

// "Did You Know" fact: section pins on screen while scrolling reveals the
// text word-by-word; once fully revealed, the page scrolls on normally.
(function () {
  var stat = document.querySelector('.dyk-stat');
  var pinSpace = document.querySelector('.dyk-pin-space');
  if (!stat || !pinSpace) return;
  if (REDUCED_MOTION) return; // words stay fully visible via CSS fallback

  // Wrap each word in a span, keeping the counter span intact as one unit
  var words = [];
  Array.prototype.slice.call(stat.childNodes).forEach(function (node) {
    if (node.nodeType === 3) { // text node → split into word spans
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (/^\s+$/.test(part) || part === '') {
          frag.appendChild(document.createTextNode(part));
        } else {
          var w = document.createElement('span');
          w.className = 'dyk-word';
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        }
      });
      stat.replaceChild(frag, node);
    } else if (node.nodeType === 1) { // element (e.g. the 75% counter)
      node.classList.add('dyk-word');
      words.push(node);
    }
  });
  if (!words.length) return;

  var ticking = false;
  function update() {
    var rect = pinSpace.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    // How far the user has scrolled through the pinned section (0 → 1)
    var total = pinSpace.offsetHeight - vh;
    var progress = total > 0 ? -rect.top / total : 1;
    progress = Math.min(Math.max(progress, 0), 1);
    // Finish the reveal at ~80% so the fully-lit fact holds for a beat
    // before the section unpins and the page moves on
    var reveal = Math.min(progress / 0.8, 1);
    var lit = Math.round(reveal * words.length);
    words.forEach(function (w, i) { w.classList.toggle('lit', i < lit); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

// Spotlight hover: glow follows the cursor across cards
(function () {
  if (REDUCED_MOTION) return;
  if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.spotlight').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });
})();

// Laptop mouse parallax: the laptop subtly tilts toward the cursor
(function () {
  if (REDUCED_MOTION) return;
  if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
  var laptop = document.getElementById('laptop');
  var hero = document.querySelector('.hero');
  if (!laptop || !hero) return;
  var ticking = false, nx = 0, ny = 0;
  function apply() {
    laptop.style.setProperty('--ry', (nx * 7) + 'deg');
    laptop.style.setProperty('--rx', (-ny * 5) + 'deg');
    ticking = false;
  }
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    nx = (e.clientX - r.left) / r.width - 0.5;
    ny = (e.clientY - r.top) / r.height - 0.5;
    if (!ticking) { requestAnimationFrame(apply); ticking = true; }
  }, { passive: true });
  hero.addEventListener('mouseleave', function () {
    nx = 0; ny = 0;
    requestAnimationFrame(apply);
  });
})();

// 3D hero logo lives in logo3d.js (three.js extrusion + rotation)
