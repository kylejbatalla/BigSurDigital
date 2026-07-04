// 3D hero logo (three.js): the logo silhouette is extruded into a real solid
// with beveled edges and slowly rotates around the Y axis.
// Shape outline data comes from resources/logo-shape.js (window.LOGO_SHAPE).
// Falls back to the static <img> if WebGL/three.js is unavailable.
(function () {
  var REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  new THREE.TextureLoader().load('resources/logo-3d-512.webp', function (tex) {
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
