/* Windows 7 desktop for osvaldomarino.dev (v2).
   CSP-friendly: same-origin file, no inline handlers. Visitor input is only ever rendered with textContent
   and is never sent anywhere: the Command Prompt is a simulation that runs entirely in the browser.
   Desktop: draggable glass windows that always stay on screen. Phones, tablets, zoomed or short screens
   and "Simple view": the same windows stacked as cards (boot.js adds html.m before first paint). */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var AUTO = window.matchMedia ? window.matchMedia('(max-width:820px),(max-height:520px),(hover:none) and (pointer:coarse)') : { matches: false, addEventListener: function () {} };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(kind, k, v) { try { var s = window[kind]; if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch (e) { return null; } }
  function ls(k, v) { return store('localStorage', k, v); }
  function ss(k, v) { return store('sessionStorage', k, v); }
  var HASHES = { about: 'about', contact: 'about', top: 'about', projects: 'projects', writeups: 'projects', homelab: 'projects', results: 'projects',
    'case-hardening': 'projects', 'case-soc': 'projects', 'case-hosting': 'projects', experience: 'experience', skills: 'experience', tools: 'experience',
    education: 'experience', server: 'server', system: 'server', terminal: 'terminal' };
  var DEFAULT_OPEN = { about: 1, projects: 1 };
  var WALLS = { aurora: 'Windows 7 blue (default)', matrix: 'green', sunset: 'orange / pink', ice: 'light blue' };

  function init() {
    var $ = function (s) { return document.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
    var wins = $$('.win'), sm = $('#sm'), orb = $('#orb'), bal = $('#bal'), hbal = $('#hbal'), viewbtn = $('#viewbtn'), smview = $('#smview');
    var z = 10, dragged = false, scr = $('#scr'), cmd = $('#cmd'), pl = $('#pl');
    function stacked() { return root.classList.contains('m'); }
    function byId(id) { return document.getElementById(id); }

    /* ---------- view mode ---------- */
    function wantSimple() { return ls('om-view') === 'simple'; }
    function applyMode() {
      var was = stacked(), m = AUTO.matches || wantSimple();
      root.classList.toggle('m', m);
      root.classList.toggle('simple-pref', !AUTO.matches && wantSimple());
      smview.hidden = AUTO.matches;
      smview.lastChild.textContent = m ? 'Windows 7 desktop view' : 'Simple view';
      if (was !== m) { if (!m) { resetDesktop(); } else { wins.forEach(function (w) { w.style.zIndex = ''; }); } syncTasks(); }
    }
    function setView(v) { ls('om-view', v); applyMode(); window.scrollTo(0, 0); if (!stacked()) focusHeading(byId('about')); else focusHeading(byId('about')); }
    viewbtn.addEventListener('click', function () { setView('simple'); });
    $('#deskbtn').addEventListener('click', function () { setView('desktop'); });
    smview.addEventListener('click', function () { closeSm(); setView(stacked() ? 'desktop' : 'simple'); });

    /* ---------- desktop layout: never off screen, sensible default hierarchy ---------- */
    var PREF = { experience: [640, 600], server: [580, 520], terminal: [660, 440] };
    function place(w, r) { w.style.left = r[0] + 'px'; w.style.top = r[1] + 'px'; w.style.width = r[2] + 'px'; w.style.height = r[3] + 'px'; }
    function area() {
      var W = window.innerWidth, H = window.innerHeight - 40, ic = { right: Math.max.apply(null, $$('.ic').map(function (e) { return e.getBoundingClientRect().right; })) };
      var gad = $('.gad.stat'), gw = gad && getComputedStyle(gad).display !== 'none' ? 226 : 0;
      var L = Math.round(ic.right) + 8, T = 10, R = W - 10 - gw, B = H - 10;
      return { W: W, H: H, L: L, T: T, R: R, B: B, aw: R - L, ah: B - T };
    }
    function cascade(w, i) {
      var a = area(), p = PREF[w.id] || [600, 500], ww = Math.min(p[0], a.W - 20), hh = Math.min(p[1], a.H - 20);
      var x = Math.round(Math.max(10, Math.min(a.W - ww - 10, a.L + (a.aw - ww) / 2 + i * 26)));
      var y = Math.round(Math.max(10, Math.min(a.H - hh - 10, a.T + (a.ah - hh) / 2 + i * 22)));
      place(w, [x, y, ww, hh]);
    }
    function layout() {
      if (stacked()) return;
      var a = area(), aboutW = Math.round(Math.max(Math.min(620, a.aw * 0.47), Math.min(a.aw * 0.5, 420)));
      var d = window.omDesk; if (d && d.L === a.L && d.R === a.R && d.ah === a.ah) aboutW = d.aboutW;
      place(byId('about'), [a.L, a.T, aboutW, a.ah]);
      var px = a.L + aboutW + 12;
      place(byId('projects'), [px, a.T, a.R - px, a.ah]);
      ['experience', 'server', 'terminal'].forEach(function (id, i) { cascade(byId(id), i); });
      wins.forEach(function (w) { delete w.dataset.max; if (!w.style.zIndex) w.style.zIndex = ++z; });
    }
    function clamp(w) {
      if (stacked()) return;
      var W = window.innerWidth, H = window.innerHeight - 40;
      if (w.dataset.max) { place(w, [0, 0, W, H]); return; }
      var r = w.getBoundingClientRect();
      if (r.width > W - 4) w.style.width = (W - 4) + 'px';
      if (r.height > H - 4) w.style.height = (H - 4) + 'px';
      r = w.getBoundingClientRect();
      w.style.left = Math.round(Math.max(0, Math.min(W - r.width, r.left))) + 'px';
      w.style.top = Math.round(Math.max(0, Math.min(H - r.height, r.top))) + 'px';
    }
    function resetDesktop() {
      dragged = false; layout();
      wins.forEach(function (w) { w.classList.remove('col'); w.classList.toggle('hid', !DEFAULT_OPEN[w.id]); delete w.dataset.min; });
      focus(byId('about'));
    }

    /* ---------- taskbar (built once, then updated, so keyboard focus is never lost) ---------- */
    var PINNED = [['about', 'About Me', 'i-doc', ''], ['projects', 'Projects', 'i-fold', ''], ['experience', 'Experience & Skills', 'i-cv', ''],
                  ['terminal', 'Command Prompt', 'i-cmd', 'C:\\>'], ['server', "This Site's Server", 'i-srv', '']];
    var tbtn = {};
    PINNED.forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tk';
      var g = document.createElement('span'); g.className = 'g ' + p[2]; if (p[3]) g.setAttribute('data-t', p[3]); g.setAttribute('aria-hidden', 'true'); b.appendChild(g);
      var l = document.createElement('span'); l.className = 'lb'; l.textContent = p[1]; b.appendChild(l);
      b.title = p[1];
      b.addEventListener('click', function () {
        var w = byId(p[0]);
        if (stacked()) return open(p[0]);
        if (w.classList.contains('focus') && !w.classList.contains('hid')) minimize(w); else open(p[0]);
      });
      $('#tasks').appendChild(b); tbtn[p[0]] = b;
    });
    function syncTasks() {
      PINNED.forEach(function (p) {
        var w = byId(p[0]), b = tbtn[p[0]], isOpen = !w.classList.contains('hid') || !!w.dataset.min, on = w.classList.contains('focus') && !w.classList.contains('hid');
        b.classList.toggle('open', isOpen); b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.setAttribute('aria-label', p[1] + (w.dataset.min ? ' (minimized)' : isOpen ? '' : ' (closed)'));
      });
    }

    /* ---------- windows ---------- */
    function focus(w) {
      wins.forEach(function (x) { if (x !== w) x.classList.remove('focus'); });
      if (w) { w.classList.remove('hid', 'col'); if (!stacked()) w.style.zIndex = ++z; w.classList.add('focus'); }
      syncTasks();
    }
    function focusHeading(w) { var h = w && byId(w.getAttribute('aria-labelledby')); if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    function minimize(w) {
      if (stacked()) { var c = w.classList.toggle('col'); w.querySelector('[data-a="min"]').setAttribute('aria-expanded', c ? 'false' : 'true'); return; }
      w.classList.add('hid'); w.dataset.min = 1; w.classList.remove('focus'); syncTasks();
    }
    function closeWin(w) {
      if (stacked()) return minimize(w);
      w.classList.add('hid'); delete w.dataset.min; w.classList.remove('focus'); syncTasks();
      var top = wins.filter(function (x) { return !x.classList.contains('hid'); }).sort(function (a, b) { return (+b.style.zIndex || 0) - (+a.style.zIndex || 0); })[0];
      if (top) { focus(top); focusHeading(top); } else orb.focus();
    }
    function open(id, opts) {
      opts = opts || {};
      var w = byId(id); if (!w) return;
      var wasHidden = w.classList.contains('hid') && !w.dataset.min;
      delete w.dataset.min; focus(w);
      if (!stacked()) { if (wasHidden && !w.style.left) cascade(w, 0); clamp(w); }
      if (opts.hash !== false && history.replaceState && HASHES[id]) history.replaceState(null, '', '#' + id);
      if (stacked()) w.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (opts.focus === false) return;
      if (id === 'terminal' && !stacked()) cmd.focus({ preventScroll: true }); else focusHeading(w);
    }
    function max(w) {
      if (stacked()) return;
      if (w.dataset.max) { var o = JSON.parse(w.dataset.max); w.style.left = o.l; w.style.top = o.t; w.style.width = o.w; w.style.height = o.h; delete w.dataset.max; clamp(w); }
      else { w.dataset.max = JSON.stringify({ l: w.style.left, t: w.style.top, w: w.style.width, h: w.style.height }); place(w, [0, 0, window.innerWidth, window.innerHeight - 40]); }
      var b = w.querySelector('[data-a="max"]'); b.textContent = w.dataset.max ? '❐' : '□';
    }
    wins.forEach(function (w) {
      var label = w.dataset.title;
      w.addEventListener('mousedown', function () { if (!w.classList.contains('focus')) focus(w); });
      w.addEventListener('focusin', function () { if (!w.classList.contains('focus') && !stacked()) focus(w); });
      var tb = w.querySelector('.tb');
      tb.addEventListener('pointerdown', function (e) {
        if (stacked() || e.button !== 0 || e.target.closest('button') || w.dataset.max) return;
        var r = w.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
        tb.setPointerCapture(e.pointerId);
        function mv(ev) {
          dragged = true;
          var W = window.innerWidth, H = window.innerHeight - 40;
          w.style.left = Math.max(-r.width + 120, Math.min(W - 120, ev.clientX - dx)) + 'px';
          w.style.top = Math.max(0, Math.min(H - 30, ev.clientY - dy)) + 'px';
        }
        function up() { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); tb.removeEventListener('pointercancel', up); }
        tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up); tb.addEventListener('pointercancel', up);
      });
      tb.addEventListener('dblclick', function (e) { if (!e.target.closest('button')) max(w); });
      w.querySelectorAll('.cap button').forEach(function (b) {
        if (b.dataset.a === 'min') b.setAttribute('aria-expanded', 'true');
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var a = b.getAttribute('data-a');
          if (a === 'close') closeWin(w); else if (a === 'min') minimize(w); else max(w);
        });
      });
      if (!label) w.dataset.title = w.id;
    });

    /* ---------- links that open windows, desktop icons, start menu ---------- */
    function go(href) { if (/^https?:/.test(href)) window.open(href, '_blank', 'noopener'); else location.href = href; }
    $$('.ic').forEach(function (i) {
      i.addEventListener('click', function () { if (i.dataset.href) go(i.dataset.href); else if (i.dataset.hash) route(i.dataset.hash); else open(i.dataset.open); });
    });
    $$('main [data-open], .sysnav [data-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault(); open(el.getAttribute('data-open'), { focus: !el.dataset.case });
        if (el.dataset.case) showCase(el.dataset.case);
      });
    });
    function showCase(id) {
      var c = byId(id); if (!c) return;
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      setTimeout(function () {
        c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        var h = c.querySelector('h3 a'); if (h) h.focus({ preventScroll: true });
        c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
      }, stacked() ? 350 : 60);
    }
    function openSm() { sm.classList.remove('hid'); orb.classList.add('down'); orb.setAttribute('aria-expanded', 'true'); var f = sm.querySelector('.lc a'); if (f) f.focus({ preventScroll: true }); }
    function closeSm() { sm.classList.add('hid'); orb.classList.remove('down'); orb.setAttribute('aria-expanded', 'false'); }
    orb.addEventListener('click', function (e) { e.stopPropagation(); if (sm.classList.contains('hid')) openSm(); else closeSm(); });
    $('#smx').addEventListener('click', function () { closeSm(); orb.focus(); });
    sm.querySelectorAll('[data-open]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); closeSm(); open(el.getAttribute('data-open')); });
    });
    sm.querySelectorAll('a:not([data-open])').forEach(function (el) { el.addEventListener('click', closeSm); });
    document.addEventListener('click', function (e) { if (!sm.classList.contains('hid') && !sm.contains(e.target) && e.target !== orb) closeSm(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!sm.classList.contains('hid')) { closeSm(); orb.focus(); return; }
      [bal, hbal].forEach(function (b) { b.classList.add('hid'); });
    });
    // Keep focus inside the Start menu while it is open (Tab wraps around).
    sm.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(sm.querySelectorAll('a,button'), function (x) { return x.offsetParent !== null && !x.hidden; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });

    /* ---------- tray balloons ---------- */
    var balTimer;
    function showBalloon(b) {
      [bal, hbal].forEach(function (x) { if (x !== b) x.classList.add('hid'); });
      b.classList.remove('hid'); clearTimeout(balTimer);
      balTimer = setTimeout(function () { b.classList.add('hid'); }, 10000);
    }
    function toggleBalloon(b) { if (b.classList.contains('hid')) showBalloon(b); else b.classList.add('hid'); }
    $('#balx').addEventListener('click', function (e) { e.stopPropagation(); bal.classList.add('hid'); $('#flag').focus(); });
    $('#balgo').addEventListener('click', function () { bal.classList.add('hid'); open('projects', { focus: false }); showCase('case-soc'); });
    $('#flag').addEventListener('click', function (e) { e.stopPropagation(); toggleBalloon(bal); });
    $('#hbalx').addEventListener('click', function (e) { e.stopPropagation(); hbal.classList.add('hid'); });
    $('#hbalgo').addEventListener('click', function () { hbal.classList.add('hid'); open('server'); });
    $('#srv').addEventListener('click', function (e) { e.stopPropagation(); toggleBalloon(hbal); });
    $('#wm').addEventListener('click', function (e) { e.preventDefault(); open('server'); });
    $('#showd').addEventListener('click', function () {
      var anyOpen = wins.some(function (w) { return !w.classList.contains('hid'); });
      wins.forEach(function (w) { if (anyOpen) { if (!w.classList.contains('hid')) { w.classList.add('hid'); w.dataset.min = 1; w.classList.remove('focus'); } } else if (w.dataset.min) { w.classList.remove('hid'); delete w.dataset.min; } });
      syncTasks();
    });
    function tick() {
      var d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
      $('#t1').textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      $('#t2').textContent = d.toLocaleDateString('en-US');
      $('#hh').style.transform = 'rotate(' + h * 30 + 'deg)'; $('#mm').style.transform = 'rotate(' + m * 6 + 'deg)'; $('#ss').style.transform = 'rotate(' + s * 6 + 'deg)';
      $('#gdate').textContent = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() + ' ' + d.getDate();
    }
    tick(); setInterval(tick, 1000);

    /* ---------- hash routing (/#projects, /#contact, links from the blog) ---------- */
    function route(hash) {
      var id = HASHES[hash]; if (!id) return;
      open(id, { hash: false, focus: false });
      if (/^case-/.test(hash)) showCase(hash);
      if (hash === 'contact') flash('contact');
      if (hash === 'skills' || hash === 'tools') { var s = byId('skills'); if (s) s.scrollIntoView({ block: 'start' }); }
    }
    function flash(id) {
      var el = byId(id); if (!el) return;
      setTimeout(function () {
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: stacked() ? 'center' : 'nearest' });
        el.parentNode.querySelectorAll('#contact, #contact + ul').forEach(function (x) { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); });
      }, 250);
    }
    window.addEventListener('hashchange', function () { route(location.hash.slice(1)); });

    /* ---------- Command Prompt (simulation; nothing leaves the browser) ---------- */
    var busy = false, typing = false, hist = [], hIdx = 0, MAX = 260;
    var P = 'C:\\Users\\Osvaldo\\homelab>';
    scr.addEventListener('click', function (e) { if (e.target.closest('a')) return; if (window.getSelection && String(window.getSelection())) return; cmd.focus({ preventScroll: true }); });
    function line(cls) { var d = document.createElement('div'); if (cls) d.className = cls; scr.insertBefore(d, pl); while (scr.childNodes.length > MAX) scr.removeChild(scr.firstChild); return d; }
    function span(p, t, c) { var s = document.createElement('span'); if (c) s.className = c; s.textContent = t; p.appendChild(s); return s; }
    function link(p, t, href) { var a = document.createElement('a'); a.href = href; a.textContent = t; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } p.appendChild(a); return a; }
    function print(t, c) { var d = line(c); d.textContent = t || ' '; scroll(); return d; }
    function scroll() { scr.scrollTop = scr.scrollHeight; }
    function echo(v) { var d = line(); span(d, P, 'w'); d.appendChild(document.createTextNode(v)); }
    function later(ms, fn) { setTimeout(fn, reduce ? 0 : ms); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var POSTS = [['Hardening my homelab: 9 findings to 0', '/blog/hardening-my-homelab/'],
                 ['Building a home SOC with Wazuh', '/blog/home-soc-with-wazuh/'],
                 ['Hosting a hardened website from home with zero open ports', '/blog/zero-open-ports-website/']];
    var HELP = [['HELP', 'show this list'], ['WHOAMI', 'who I am, in a few lines'], ['PROJECTS', 'my three homelab projects'], ['RESULTS', 'before/after numbers (Oct 20, 2026)'],
                ['SKILLS', 'skills and where I used them'], ['EXPERIENCE', 'experience and education'], ['CERTS', 'certifications and training'],
                ['CONTACT', 'email, LinkedIn, GitHub'], ['BLOG', 'my write-ups'], ['SYSTEMINFO', 'the server hosting this site'],
                ['NMAP', 'simulated scan of this site'], ['DIR / TYPE <file>', 'list or print files'], ['THEME DARK|LIGHT', 'dark or light theme (AUTO = follow system)'], ['THEME LIST', 'wallpapers'], ['CLS', 'clear the screen'], ['EXIT', 'close this window']];
    var VISIBLE = ['help', 'whoami', 'projects', 'results', 'skills', 'experience', 'edu', 'certs', 'contact', 'blog', 'writeups', 'dir', 'ls', 'type', 'cat', 'systeminfo', 'nmap', 'theme', 'date', 'ver', 'echo', 'ping', 'cls', 'clear', 'exit'];
    function whoami() {
      print('Osvaldo Marino');
      print('Cybersecurity student at Georgia State University: B.B.A. Computer Information Systems, Cybersecurity concentration, expected Dec 2027. First-generation college student.');
      print('Builds and defends a self-hosted homelab: Ubuntu Server, Wazuh SIEM, Greenbone scanning, and this website behind a Cloudflare Tunnel.');
      print(byId('about').querySelector('.role').textContent.indexOf('Seeking') > -1 ? 'Seeking cybersecurity internships. Atlanta, GA.' : 'Looking for cybersecurity internships.', 'gr');
    }
    function contact() {
      var d = line(); span(d, 'email     ', 'm'); link(d, 'contact@osvaldomarino.dev', 'mailto:contact@osvaldomarino.dev');
      d = line(); span(d, 'linkedin  ', 'm'); link(d, 'linkedin.com/in/omarino1', 'https://www.linkedin.com/in/omarino1');
      d = line(); span(d, 'github    ', 'm'); link(d, 'github.com/oemarino', 'https://github.com/oemarino');
      scroll();
    }
    function blog() { POSTS.forEach(function (p, i) { var d = line(); span(d, (i + 1) + '. ', 'm'); link(d, p[0], p[1]); }); var d = line(); span(d, 'All posts: ', 'm'); link(d, 'osvaldomarino.dev/blog', '/blog/'); scroll(); }
    function results() {
      print('Historical results from tests on Oct 20, 2026 (not live monitoring):', 'm');
      print('Greenbone: 6 Medium + 3 Low -> 0 real findings (1 documented false positive; 0 Critical/High before and after)');
      print('External:  0 of 1,007 IPv4 TCP ports open (not a full 65,535-port or UDP scan)');
      print('Wazuh:     rule 5712 caught my SSH brute-force test; a boolean SQL injection was MISSED (documented)');
    }
    function projects() {
      [['Hardening my homelab: 9 findings to 0', 'Greenbone/OpenVAS, OpenSSH, ufw, nginx TLS proxy, Tailscale', '#case-hardening'],
       ['Building a home SOC with Wazuh', 'Wazuh 4.14.9, FIM, DVWA/Juice Shop lab, MITRE ATT&CK', '#case-soc'],
       ['Hardened self-hosting via Cloudflare Tunnel', 'Docker, nginx-unprivileged, CSP, cloudflared', '#case-hosting']].forEach(function (p) {
        var d = line(); span(d, '> ', 'gr'); span(d, p[0], 'w b'); print('  ' + p[1], 'm');
        d = line(); span(d, '  ', ''); var a = link(d, 'open case study', p[2]); a.addEventListener('click', function (e) { e.preventDefault(); open('projects', { focus: false }); showCase(p[2].slice(1)); });
      });
      var d = line(); span(d, '  repo: ', 'm'); link(d, 'github.com/oemarino/homelab', 'https://github.com/oemarino/homelab');
      scroll();
    }
    function skills() {
      [['Linux admin', 'Ubuntu Server, OpenSSH hardening, ufw, sysctl'], ['Vuln mgmt', 'Greenbone/OpenVAS, remediation, false-positive analysis'],
       ['SIEM/triage', 'Wazuh, FIM, detection testing, MITRE ATT&CK'], ['Network sec', 'Cloudflare Tunnel, Tailscale, exposure checks'],
       ['Containers', 'Docker, nginx, CSP/security headers']].forEach(function (r) { var d = line(); span(d, (r[0] + '              ').slice(0, 14), 'y'); span(d, r[1]); });
      scroll();
    }
    function certs() {
      print('[ ] CompTIA Security+ SY0-701 - IN PROGRESS, exam expected Dec 2026');
      print('[x] TryHackMe SOC Level 1 path - COMPLETED July 2026 (Feb-Jul 2026)');
      var d = line(); span(d, '    profile: ', 'm'); link(d, 'tryhackme.com/p/osvaldomarino82', 'https://tryhackme.com/p/osvaldomarino82'); scroll();
    }
    function experience() {
      var items = byId('experience').querySelectorAll('h3 + ul li b');
      print('Experience:', 'y');
      Array.prototype.forEach.call(items, function (b) { print('  ' + b.parentNode.textContent.replace(/\s+/g, ' ').trim()); });
      print('Education:', 'y');
      print('  Georgia State University - B.B.A. CIS, Cybersecurity concentration, expected Dec 2027');
      print("  Dean's List (7 semesters) | HOPE Scholarship | First-generation college student", 'm');
    }
    function systeminfo() {
      [['Website:', 'osvaldomarino.dev'], ['Hosted on:', 'my own homelab server, at home (no cloud host)'], ['OS Name:', 'Ubuntu Server 24.04 LTS'],
       ['Processor:', 'Intel Core i5-6500T (4 cores)'], ['Total Memory:', '16 GB'], ['Web Server:', 'nginx in a locked-down Docker container'],
       ['Delivery:', 'Cloudflare Tunnel, outbound only'], ['Exposure:', '0 of 1,007 IPv4 TCP ports open (checked Oct 20, 2026)'], ['Monitoring:', 'Wazuh SIEM']].forEach(function (r) {
        var d = line(); span(d, r[0] + new Array(Math.max(2, 15 - r[0].length)).join(' '), 'y'); span(d, r[1]);
      });
      var d = line(); span(d, 'More:          ', 'y'); link(d, 'How I host this site', '/blog/zero-open-ports-website/');
      scroll();
    }
    function nmap() {
      busy = true;
      var n = new Date();
      print('[SIMULATED] Nothing is scanned. This replays what a scan of this site shows, plus my real Oct 20, 2026 result.', 'm');
      print('Starting Nmap ( https://nmap.org ) at ' + n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()) + ' ' + pad(n.getHours()) + ':' + pad(n.getMinutes()));
      var out = [['Nmap scan report for osvaldomarino.dev (Cloudflare edge)'], ['PORT    STATE SERVICE', 'm'],
        ['80/tcp  open  http     <- Cloudflare\u2019s edge, not my house'], ['443/tcp open  https    <- Cloudflare\u2019s edge, not my house'], [''],
        ['My home connection (real outside-in check, Oct 20, 2026):', 'gr'], ['  0 of 1,007 IPv4 TCP ports open', 'gr'], ['  (not a full 65,535-port or UDP scan)', 'm']];
      var i = 0;
      (function step() { if (i >= out.length) { busy = false; return; } print(out[i][0], out[i][1]); i++; later(i < 2 ? 400 : 120, step); })();
    }
    function rmrf() {
      busy = true;
      print('rm: descending into / with --no-preserve-root \ud83d\ude2c', 'y');
      var bar = print('', 'r'), n = 0, total = 20;
      function render() { var full = Math.round(n / total * 20); bar.textContent = '[' + new Array(full + 1).join('\u2588') + new Array(20 - full + 1).join('\u2591') + '] ' + Math.round(n / total * 100) + '%'; }
      function finish() { print('Nice try. \ud83d\ude09', 'r b'); print('(Simulated: nothing was deleted and nothing was sent anywhere. This prompt only runs in your browser.)', 'm'); busy = false; }
      if (reduce) { n = total; render(); finish(); return; }
      var iv = setInterval(function () { n++; render(); if (n >= total) { clearInterval(iv); setTimeout(finish, 300); } }, 60);
      render();
    }
    function hire() {
      busy = true;
      print('[sudo] password for recruiter: ********');
      later(450, function () { print('Permission granted \u2705 Opening my contact info...', 'gr b'); later(900, function () { busy = false; open('about', { focus: false }); flash('contact'); }); });
    }
    function theme(arg) {
      var T = window.omTheme;
      if (T && (arg === 'dark' || arg === 'light' || arg === 'auto')) {
        T.set(arg);
        return print(arg === 'auto' ? 'Theme now follows your system setting (currently ' + T.get() + ').' : 'Theme set to ' + arg + '. Saved for next time.', 'gr');
      }
      var cur = root.getAttribute('data-wall') || 'aurora';
      if (!arg || arg === 'list') {
        print('Wallpapers (current: ' + cur + '):');
        Object.keys(WALLS).forEach(function (k) { var d = line(); span(d, (k === cur ? ' * ' : '   ') + k + new Array(9 - k.length).join(' '), k === cur ? 'gr' : ''); span(d, WALLS[k], 'm'); });
        if (T) print('Theme: ' + T.get() + (T.pref() === 'auto' ? ' (following your system)' : ' (your choice)') + '. Change it with THEME DARK, THEME LIGHT or THEME AUTO.');
        print('Usage: THEME <wallpaper> | THEME DARK | THEME LIGHT | THEME AUTO', 'm'); scroll(); return;
      }
      if (!WALLS[arg]) return print("theme: unknown theme '" + arg + "'. Try THEME DARK, THEME LIGHT or THEME LIST", 'r');
      if (arg === 'aurora') root.removeAttribute('data-wall'); else root.setAttribute('data-wall', arg);
      ls('om-wall', arg);
      print('Wallpaper set to ' + arg + '. Saved for next time.', 'gr');
    }
    function matrix() {
      if (reduce) return print('Matrix rain skipped: your system prefers reduced motion.', 'm');
      if (document.querySelector('.matrix-rain')) return;
      print('Wake up, Neo... (click or press Esc to exit)', 'gr');
      var cv = document.createElement('canvas'); cv.className = 'matrix-rain'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
      var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, cols, drops, fs = 16;
      function size() { W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cols = Math.ceil(W / fs); drops = []; for (var i = 0; i < cols; i++) drops.push(Math.random() * -H / fs); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
      size();
      var chars = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd0123456789$#@<>/{}';
      var raf, ended = false, start = performance.now(), lastT = 0;
      function frame(t) {
        if (t - lastT > 45) { lastT = t; ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, W, H); ctx.font = fs + 'px ui-monospace, monospace';
          for (var i = 0; i < cols; i++) { var y = drops[i] * fs; ctx.fillStyle = Math.random() > 0.96 ? '#d1fae5' : '#22c55e'; ctx.fillText(chars.charAt(Math.floor(Math.random() * chars.length)), i * fs, y); if (y > H && Math.random() > 0.975) drops[i] = 0; drops[i]++; } }
        if (t - start > 4000) return end();
        raf = requestAnimationFrame(frame);
      }
      function end() { if (ended) return; ended = true; cancelAnimationFrame(raf); cv.classList.add('out'); document.removeEventListener('keydown', onEsc); window.removeEventListener('resize', size); setTimeout(function () { if (cv.parentNode) cv.parentNode.removeChild(cv); }, 650); print('...back to reality.', 'm'); }
      function onEsc(e) { if (e.key === 'Escape') end(); }
      cv.addEventListener('click', end); document.addEventListener('keydown', onEsc); window.addEventListener('resize', size);
      raf = requestAnimationFrame(frame);
    }
    var FILES = { 'about.txt': whoami, 'contact.txt': contact, 'results.txt': results, 'skills.txt': skills };
    function dir(arg) {
      if (arg === 'blog' || arg === 'blog/') return blog();
      if (arg === 'projects' || arg === 'projects/') return projects();
      if (arg) return print('File Not Found: ' + arg, 'r');
      var d = line(); Object.keys(FILES).forEach(function (f) { span(d, f + '   '); }); span(d, '<DIR> projects   ', 'cy'); span(d, '<DIR> blog', 'cy'); scroll();
    }
    function type(arg) {
      if (!arg) return print('The syntax of the command is incorrect. Try TYPE about.txt', 'r');
      if (FILES[arg]) return FILES[arg]();
      if (arg === 'projects' || arg === 'blog' || /\/$/.test(arg)) return print('Access is denied. (' + arg + ' is a directory)', 'r');
      print('The system cannot find the file specified.', 'r');
    }
    function run(raw) {
      var c0 = raw.trim().replace(/\s+/g, ' '), low = c0.toLowerCase(), parts = low.split(' '), c = parts[0], rest = c0.slice(c.length).trim(), restLow = rest.toLowerCase();
      if (!c0) return;
      if (/^(sudo )?rm -rf (--no-preserve-root )?\/\*?$/.test(low) || /^(del|rd|rmdir) \/s \/q c:\\?$/.test(low) || /^format c:?$/.test(low)) return rmrf();
      if (/^(sudo )?hire( osvaldo)?$/.test(low)) return hire();
      switch (c) {
        case 'help': case '?': case '/?':
          HELP.forEach(function (h) { var d = line(); span(d, stacked() ? h[0] + '  ' : h[0] + new Array(Math.max(2, 22 - h[0].length)).join(' '), 'gr'); span(d, h[1], 'm'); });
          print('This prompt is a simulation. It runs in your browser and cannot reach my server.', 'y'); scroll(); return;
        case 'cls': case 'clear': while (scr.firstChild && scr.firstChild !== pl) scr.removeChild(scr.firstChild); return;
        case 'whoami': return whoami();
        case 'projects': return projects();
        case 'results': return results();
        case 'skills': return skills();
        case 'experience': case 'edu': case 'education': return experience();
        case 'certs': case 'certifications': return certs();
        case 'blog': case 'writeups': return blog();
        case 'contact': return contact();
        case 'dir': case 'ls': return dir(restLow.replace(/^\/b\s*/, ''));
        case 'type': case 'cat': return type(restLow);
        case 'cd': return print(restLow === '' || restLow === '~' || restLow === '.' ? P.slice(0, -1) : 'This is a portfolio, not a filesystem. Try DIR.', 'm');
        case 'pwd': return print('C:\\Users\\Osvaldo\\homelab');
        case 'date': case 'time': return print(new Date().toString());
        case 'ver': return print('Osvaldo Marino homelab [osvaldomarino.dev, Windows 7 edition]');
        case 'echo': return print(rest);
        case 'ping': return print('Reply from osvaldomarino.dev: pong (simulated)');
        case 'systeminfo': case 'server': case 'hostname': return systeminfo();
        case 'nmap': return nmap();
        case 'theme': return theme(parts[1]);
        case 'hack': case 'matrix': return matrix();
        case 'exit': return closeWin(byId('terminal'));
        case 'sudo': return print('[sudo] nice try. Only recruiters get sudo here. \ud83d\ude09', 'y');
        default: print("'" + c0.split(' ')[0].slice(0, 40) + "' is not recognized as an internal or external command. Type HELP.", 'r');
      }
    }
    function submit() {
      if (busy) return;
      var v = cmd.value.slice(0, 100); cmd.value = '';
      echo(v);
      if (v.trim()) { hist.push(v); if (hist.length > 50) hist.shift(); }
      hIdx = hist.length; run(v); print(''); scroll();
    }
    function complete() {
      var v = cmd.value.replace(/^\s+/, '').toLowerCase(), opts;
      if (/^theme /.test(v)) { var p = v.slice(6); opts = Object.keys(WALLS).concat('list', 'dark', 'light', 'auto').filter(function (k) { return k.indexOf(p) === 0; }).map(function (k) { return 'theme ' + k; }); }
      else if (/^(type|cat|dir|ls) /.test(v)) { var verb = v.split(' ')[0], q = v.slice(verb.length + 1); opts = Object.keys(FILES).concat(['projects/', 'blog/']).filter(function (k) { return k.indexOf(q) === 0; }).map(function (k) { return verb + ' ' + k; }); }
      else opts = VISIBLE.filter(function (k) { return k.indexOf(v) === 0; });
      if (opts.length === 1) cmd.value = opts[0] + (opts[0].indexOf(' ') > -1 ? '' : ' ');
      else if (opts.length > 1) { echo(cmd.value); print(opts.join('  '), 'm'); }
    }
    cmd.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!typing) submit(); }
      else if (e.key === 'ArrowUp') { if (!hist.length) return; e.preventDefault(); hIdx = Math.max(0, hIdx - 1); cmd.value = hist[hIdx]; }
      else if (e.key === 'ArrowDown') { if (!hist.length) return; e.preventDefault(); hIdx = Math.min(hist.length, hIdx + 1); cmd.value = hist[hIdx] || ''; }
      else if (e.key === 'Tab') { if (!cmd.value.trim()) return; e.preventDefault(); complete(); }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); run('cls'); }
      else if (e.key === 'c' && e.ctrlKey && !String(window.getSelection())) { e.preventDefault(); echo(cmd.value + '^C'); cmd.value = ''; scroll(); }
    });
    cmd.addEventListener('focus', function () { if (stacked()) setTimeout(function () { pl.scrollIntoView({ block: 'nearest' }); scroll(); }, 300); });
    var chips = $('.chips');
    ['help', 'whoami', 'projects', 'results', 'sudo hire osvaldo', 'nmap'].forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c.toUpperCase();
      b.setAttribute('aria-label', 'Run ' + c);
      b.addEventListener('click', function () {
        if (typing || busy) return; typing = true; cmd.value = ''; var i = 0;
        function done() { typing = false; submit(); }
        if (reduce) { cmd.value = c; return done(); }
        (function step() { cmd.value = c.slice(0, ++i); if (i < c.length) setTimeout(step, 30); else setTimeout(done, 140); })();
      });
      chips.appendChild(b);
    });
    scroll();

    /* ---------- light / dark theme toggles (theme.js, bundled in boot.js) ---------- */
    if (window.omTheme) window.omTheme.bind();

    /* ---------- start ---------- */
    applyMode();
    if (!stacked()) { layout(); wins.forEach(function (w) { w.classList.toggle('hid', !DEFAULT_OPEN[w.id]); }); }
    focus(byId('about'));
    var startHash = (location.hash || '').slice(1);
    if (HASHES[startHash]) route(startHash);
    else if (!stacked() && startHash === 'start') openSm();
    var lastStacked = stacked();
    window.addEventListener('resize', function () {
      applyMode();
      var s = stacked();
      if (!s && (s !== lastStacked || !dragged)) layout(); else if (!s) wins.forEach(clamp);
      lastStacked = s; syncTasks();
    });
    if (!stacked() && !ss('om-hbal')) setTimeout(function () { ss('om-hbal', '1'); if (!stacked()) showBalloon(hbal); }, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
