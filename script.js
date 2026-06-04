// Mobile menu
document.getElementById('menuToggle').addEventListener('click', function () {
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(function (a) {
  a.addEventListener('click', function () {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Form (front-end demo — wire up to email/backend service when ready)
function handleSubmit(e) {
  e.preventDefault();
  var note = document.getElementById('formNote');
  note.textContent = "Thanks! This is a demo form — connect it to email or a form service to receive messages.";
  note.style.color = "#0b4f8a";
  note.style.fontWeight = "600";
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
