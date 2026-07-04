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
  ['touchstart', 'click', 'scroll'].forEach(function (evt) {
    document.addEventListener(evt, tryPlay, { once: true, passive: true });
  });
})();

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

// Load Google reCAPTCHA v3 (invisible — no puzzle, score-based).
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

// Scroll progress bar (thin gradient line at the very top)
(function () {
  if (REDUCED_MOTION) return;
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  var ticking = false;
  function update() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = 'scaleX(' + Math.min(Math.max(p, 0), 1) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// Hero parallax: content drifts up and fades as you scroll (Apple-style)
(function () {
  if (REDUCED_MOTION) return;
  var hero = document.querySelector('.hero');
  var layout = document.querySelector('.hero-layout');
  var cue = document.querySelector('.scroll-cue');
  if (!hero || !layout) return;
  var ticking = false;
  function update() {
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

// 3D hero logo (three.js): the logo silhouette is extruded into a real solid
// with beveled edges and slowly rotates around the Y axis.
// Shape outline data comes from resources/logo-shape.js (window.LOGO_SHAPE).
// Falls back to the static <img> if WebGL/three.js is unavailable.
(function () {
  var container = document.getElementById('logo3d');
  if (!container || typeof THREE === 'undefined') return;
  var shapeData = window.LOGO_SHAPE;
  if (!shapeData || !shapeData.length) return;
  var fallback = container.querySelector('img');

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) { return; } // no WebGL — keep the image fallback
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  // Camera sits far enough back that the logo's corners never project
  // outside the canvas as they swing toward the viewer mid-rotation
  var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 5.4;

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var key = new THREE.DirectionalLight(0xffffff, 0.65);
  key.position.set(3, 4, 6);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x64b5f6, 0.35); // cool light for the side walls
  rim.position.set(-4, -1, -3);
  scene.add(rim);

  var group = new THREE.Group();
  group.rotation.x = 0.1; // subtle tilt so the depth reads clearly
  scene.add(group);

  // Build THREE.Shapes from the traced outline (coords are 0..1, matching texture UVs)
  var shapes = shapeData.map(function (s) {
    var sh = new THREE.Shape();
    s.outer.forEach(function (p, i) { i === 0 ? sh.moveTo(p[0], p[1]) : sh.lineTo(p[0], p[1]); });
    sh.closePath();
    s.holes.forEach(function (hole) {
      var path = new THREE.Path();
      hole.forEach(function (p, i) { i === 0 ? path.moveTo(p[0], p[1]) : path.lineTo(p[0], p[1]); });
      path.closePath();
      sh.holes.push(path);
    });
    return sh;
  });

  var geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.18,             // thickness (in shape units; shape is ~1 wide)
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3
  });
  geo.center();

  // Faces get the logo texture; extruded side walls get a deep metallic blue
  var faceMat = new THREE.MeshStandardMaterial({ color: 0x2b7fd4, roughness: 0.5, metalness: 0.2 });
  var sideMat = new THREE.MeshStandardMaterial({ color: 0x0c3e6e, roughness: 0.35, metalness: 0.5 });
  var mesh = new THREE.Mesh(geo, [faceMat, sideMat]);
  mesh.scale.set(2.5, 2.5, 2.5);
  group.add(mesh);

  new THREE.TextureLoader().load('resources/logo-3d.png', function (tex) {
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    faceMat.map = tex;
    faceMat.color.set(0xffffff);
    faceMat.needsUpdate = true;
  });
  // If the texture can't load, the solid blue face color above still looks right

  function resize() {
    var s = container.clientWidth || 320;
    renderer.setSize(s, s);
  }
  window.addEventListener('resize', resize, { passive: true });

  var running = false, rafId = null;
  function tick() {
    group.rotation.y += 0.006; // ~1 full turn every 17s
    renderer.render(scene, camera);
    rafId = running ? requestAnimationFrame(tick) : null;
  }
  function start() { if (!running) { running = true; rafId = requestAnimationFrame(tick); } }
  function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  container.appendChild(renderer.domElement);
  if (fallback) fallback.style.display = 'none';
  resize();

  if (REDUCED_MOTION) { renderer.render(scene, camera); return; } // static frame

  // Only animate while the hero is on screen
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
    }, { threshold: 0 });
    io.observe(container);
  } else {
    start();
  }
})();
