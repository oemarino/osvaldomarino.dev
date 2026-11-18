/* Windows 7 chrome for osvaldomarino.dev/blog: Start menu + taskbar clock + saved wallpaper + light/dark toggle (theme.js).
   CSP-friendly external file. Without JS the orb is a plain link home. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  try { var w = localStorage.getItem('om-wall'); if (w && /^(matrix|sunset|ice)$/.test(w)) root.setAttribute('data-wall', w); } catch (e) {}
  function init() {
    var sm = document.getElementById('sm'), orb = document.getElementById('orb'), x = document.getElementById('smx');
    function open() { sm.classList.remove('hid'); orb.classList.add('down'); orb.setAttribute('aria-expanded', 'true'); var f = sm.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
    function close() { sm.classList.add('hid'); orb.classList.remove('down'); orb.setAttribute('aria-expanded', 'false'); }
    orb.setAttribute('role', 'button'); orb.setAttribute('aria-expanded', 'false'); orb.setAttribute('aria-label', 'Start menu');
    orb.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (sm.classList.contains('hid')) open(); else close(); });
    x.addEventListener('click', function () { close(); orb.focus(); });
    document.addEventListener('click', function (e) { if (!sm.classList.contains('hid') && !sm.contains(e.target) && e.target !== orb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sm.classList.contains('hid')) { close(); orb.focus(); } });
    var t1 = document.getElementById('t1'), t2 = document.getElementById('t2');
    function tick() { var d = new Date(); t1.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); t2.textContent = d.toLocaleDateString('en-US'); }
    tick(); setInterval(tick, 15000);
    if (window.omTheme) window.omTheme.bind();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
