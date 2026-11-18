/* Runs before first paint: marks JS as on, picks desktop vs stacked layout, restores the saved wallpaper. */
(function () {
  var r = document.documentElement, s = null, w = null;
  r.classList.add('js');
  try { s = localStorage.getItem('om-view'); w = localStorage.getItem('om-wall'); } catch (e) {}
  var auto = window.matchMedia && window.matchMedia('(max-width:820px),(max-height:520px),(hover:none) and (pointer:coarse)').matches;
  if (auto || s === 'simple') r.classList.add('m');
  if (!auto && s === 'simple') r.classList.add('simple-pref');
  if (w && /^(matrix|sunset|ice)$/.test(w)) r.setAttribute('data-wall', w);
  // Default desktop window rectangles, computed before first paint so the windows never jump (no layout shift).
  // win7.js uses the same numbers (window.omDesk) when it takes over.
  var W = window.innerWidth, H = window.innerHeight - 40, rows = Math.max(1, Math.floor((H - 8 - 8 + 2) / 82)), cols = Math.ceil(9 / rows);
  var gad = W >= 1560 && window.innerHeight >= 760 ? 226 : 0, L = 6 + cols * 86 + (cols - 1) * 2 + 8, T = 10, R = W - 10 - gad, aw = R - L, ah = H - 10 - T;
  var aboutW = Math.round(Math.max(Math.min(620, aw * 0.47), Math.min(aw * 0.5, 420))), px = L + aboutW + 12;
  window.omDesk = { L: L, T: T, R: R, aw: aw, ah: ah, aboutW: aboutW, px: px };
  var st = r.style; st.setProperty('--ax', L + 'px'); st.setProperty('--aw', aboutW + 'px'); st.setProperty('--px', px + 'px'); st.setProperty('--pw', (R - px) + 'px'); st.setProperty('--wh', ah + 'px');
})();
