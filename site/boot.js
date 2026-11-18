/* Light / dark theme ("Windows 7 dark Aero"). Loaded before first paint so the right theme shows from the start.
   Default: dark (light is the alternate option). A choice made with a toggle is saved in localStorage ('om-theme2'). */
(function () {
  var r = document.documentElement, KEY = 'om-theme2', subs = [];
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var COLOR = { light: '#0d4790', dark: '#0a1424' };
  function saved() { try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; } }
  function cur() { return saved() || 'dark'; }
  function apply() {
    var t = cur(), s = saved(), m = document.querySelectorAll('meta[name="theme-color"]');
    r.classList.toggle('dark', t === 'dark');
    r.style.colorScheme = t;
    for (var i = 0; i < m.length; i++) { if (!m[i].getAttribute('data-c')) m[i].setAttribute('data-c', m[i].content); m[i].content = COLOR[t]; }
    for (var j = 0; j < subs.length; j++) { try { subs[j](t); } catch (e) {} }
  }
  function fade() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    r.classList.add('theme-anim'); clearTimeout(fade.t); fade.t = setTimeout(function () { r.classList.remove('theme-anim'); }, 450);
  }
  function set(v) {
    try { if (v === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {}
    fade(); apply();
  }
  /* Wire every [data-theme-toggle] button: aria-pressed = dark theme on; tooltip says what a click does. */
  function bind(root) {
    var bs = (root || document).querySelectorAll('[data-theme-toggle]');
    function sync(t) {
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i], on = t === 'dark';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.title = on ? 'Dark theme is on. Click for the light theme' : 'Dark theme is off. Click for the dark theme';
        var st = b.querySelector('.st'); if (st) st.textContent = on ? 'On' : 'Off';
      }
    }
    for (var i = 0; i < bs.length; i++) bs[i].addEventListener('click', function (e) { e.stopPropagation(); set(cur() === 'dark' ? 'light' : 'dark'); });
    subs.push(sync); sync(cur());
  }
  window.omTheme = { get: cur, pref: function () { return saved() || 'auto'; }, set: set, on: function (f) { subs.push(f); }, bind: bind };
  if (mq) { var h = function () { if (!saved()) apply(); }; if (mq.addEventListener) mq.addEventListener('change', h); else if (mq.addListener) mq.addListener(h); }
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
  apply();
})();
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
