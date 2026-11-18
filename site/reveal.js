/* Scroll reveal, progress bar and aurora parallax. Progressive enhancement:
   content is fully visible without this file (hiding only applies under html.js). */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal, .reveal-h');

  // Stagger tiles inside each [data-stagger] group (75ms apart).
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var i = 0;
    group.querySelectorAll('.reveal').forEach(function (el) {
      el.style.setProperty('--d', (i++ * 75) + 'ms');
    });
  });
  // Hero: gentle sequence on load.
  document.querySelectorAll('.hero .reveal, .hero .reveal-h').forEach(function (el, i) {
    el.style.setProperty('--d', (i * 90) + 'ms');
    el.style.transitionDelay = (i * 90) + 'ms';
  });

  if (reduce || !('IntersectionObserver' in window)) return; // leave everything visible, no motion
  root.classList.add('js');

  function show(el) {
    el.classList.add('is-visible');
    // After the entrance finishes, drop the stagger delay so hover feels instant.
    el.addEventListener('transitionend', function done(e) {
      if (e.target !== el || e.propertyName !== 'transform') return;
      el.classList.add('done');
      el.style.transitionDelay = '';
      el.removeEventListener('transitionend', done);
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      // Reveal when entering, or if it was skipped past (fast scroll / anchor jump).
      if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) { show(entry.target); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });

  // Safety net: never leave content hidden (e.g. anchor jumps, print).
  window.addEventListener('beforeprint', function () { els.forEach(show); });

  // Progress bar (if no CSS scroll-timeline) + aurora parallax, one rAF per scroll.
  var bar = document.querySelector('.progress');
  var aurora = document.querySelector('.aurora');
  var cssTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset || root.scrollTop;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    if (bar && !cssTimeline) bar.style.transform = 'scaleX(' + Math.min(1, y / max).toFixed(4) + ')';
    if (y >= max - 4) els.forEach(function (el) { if (!el.classList.contains('is-visible')) { show(el); io.unobserve(el); } });
    if (aurora) aurora.style.transform = 'translate3d(0,' + (-Math.min(y * 0.12, 180)).toFixed(1) + 'px,0)';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
