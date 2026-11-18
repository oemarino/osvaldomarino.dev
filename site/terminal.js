/* Interactive hero terminal + theme switcher for osvaldomarino.dev.
   CSP-friendly: external same-origin file, no inline handlers, user input is only ever
   rendered with textContent. Without JS the static terminal demo still shows. */
(function () {
  'use strict';
  var root = document.documentElement;
  var THEMES = {
    aurora: 'purple · cyan · pink (default)',
    matrix: 'green on black',
    sunset: 'orange · pink · amber',
    ice: 'blue · cyan · frost'
  };
  var SWATCH = { aurora: ['#7c3aed', '#06b6d4', '#f472b6'], matrix: ['#16a34a', '#22c55e', '#84cc16'],
                 sunset: ['#f97316', '#ec4899', '#f59e0b'], ice: ['#3b82f6', '#06b6d4', '#a5f3fc'] };

  // Apply the saved theme as early as possible (this file loads in <head>).
  function getSaved() { try { return localStorage.getItem('om-theme'); } catch (e) { return null; } }
  function applyTheme(name) {
    if (name && name !== 'aurora' && THEMES[name]) root.setAttribute('data-theme', name);
    else root.removeAttribute('data-theme');
  }
  applyTheme(getSaved());

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    var term = document.querySelector('.term');
    if (!term) return;                       // blog pages: theme only
    var body = term.querySelector('.tbody');
    var bar = term.querySelector('.tb');
    var title = bar.querySelector('span');
    var dots = bar.querySelectorAll('i');
    var active = false, busy = false, input, inputLine;
    var history = [], hIdx = 0, MAX_LINES = 200;
    var PROMPT = 'osvaldo@homelab:~$ ';

    // Traffic-light dots become real buttons: red/yellow minimize, green restores.
    var labels = ['Minimize terminal', 'Minimize terminal', 'Restore terminal'];
    Array.prototype.forEach.call(dots, function (d, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'dot-btn'; b.setAttribute('aria-label', labels[i]);
      b.style.background = d.style.background;
      d.parentNode.replaceChild(b, d);
      b.addEventListener('click', function (e) { e.stopPropagation(); if (i === 2) restore(); else minimize(); });
    });

    term.setAttribute('tabindex', '0');
    term.setAttribute('role', 'region');
    term.setAttribute('aria-label', 'Interactive terminal. Press Enter or click to type commands.');
    term.classList.add('term-js');

    // ---------- "this is typeable" affordances (JS-only, so no-JS visitors never see them) ----------
    var badge = document.createElement('span');
    badge.className = 'term-badge';
    badge.setAttribute('aria-hidden', 'true');
    span(badge, '\u2328 ', 'kb'); span(badge, 'Interactive \u2014 ', 'long'); span(badge, 'try typing', '');
    bar.appendChild(badge);
    var wrap = document.createElement('div');
    wrap.className = 'term-wrap';
    term.parentNode.insertBefore(wrap, term);
    wrap.appendChild(term);
    var chips = document.createElement('div');
    chips.className = 'term-chips';
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', 'Try a command in the terminal');
    span(chips, 'Try:', 'try');
    ['help', 'whoami', 'sudo hire osvaldo', 'matrix'].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'term-chip'; b.textContent = c;
      b.setAttribute('aria-label', 'Run ' + c + ' in the terminal');
      b.addEventListener('click', function () { typeCmd(c); });
      chips.appendChild(b);
    });
    wrap.appendChild(chips);
    function used() { term.classList.add('used'); }

    // ---------- output helpers ----------
    function line(cls) {
      var d = document.createElement('div');
      d.className = 'tl' + (cls ? ' ' + cls : '');
      body.insertBefore(d, inputLine || null);
      while (body.children.length > MAX_LINES + 1) body.removeChild(body.firstChild);
      return d;
    }
    function print(text, cls) { var d = line(cls); d.textContent = text; scroll(); return d; }
    function span(parent, text, cls) { var s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text; parent.appendChild(s); return s; }
    function link(parent, text, href, external) {
      var a = document.createElement('a'); a.href = href; a.textContent = text;
      if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      parent.appendChild(a); return a;
    }
    function scroll() { body.scrollTop = body.scrollHeight; }
    function echoCmd(cmd) {
      var d = line('echo');
      span(d, 'osvaldo@homelab', 'pr'); d.appendChild(document.createTextNode(':')); span(d, '~', 'pa');
      d.appendChild(document.createTextNode('$ ' + cmd));
    }
    function later(ms, fn) { setTimeout(fn, reduce ? 0 : ms); }

    // ---------- activation ----------
    function activate(focus) {
      if (active) { if (focus) input.focus({ preventScroll: true }); return; }
      active = true;
      term.classList.add('live', 'skip-intro');
      term.removeAttribute('tabindex');
      var lns = body.querySelectorAll('.ln');
      var last = lns[lns.length - 1];
      if (last && last.querySelector('.cur')) last.parentNode.removeChild(last);
      body.removeAttribute('aria-hidden');
      body.setAttribute('role', 'log');
      body.setAttribute('aria-live', 'polite');

      inputLine = document.createElement('div');
      inputLine.className = 'tl input-line';
      span(inputLine, 'osvaldo@homelab', 'pr'); inputLine.appendChild(document.createTextNode(':'));
      span(inputLine, '~', 'pa'); inputLine.appendChild(document.createTextNode('$\u00a0'));
      input = document.createElement('input');
      input.type = 'text'; input.className = 'term-input'; input.maxLength = 100; input.placeholder = (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) ? "type 'help'" : "type 'help' and press Enter";
      input.setAttribute('aria-label', 'Terminal command');
      input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off');
      input.setAttribute('autocorrect', 'off'); input.setAttribute('spellcheck', 'false');
      input.setAttribute('enterkeyhint', 'send');
      inputLine.appendChild(input);
      span(inputLine, '', 'cur idle-cur');
      body.appendChild(inputLine);
      var h = line('hint');
      h.textContent = "Type 'help' to explore. Tab completes, \u2191/\u2193 browse history.";
      input.addEventListener('keydown', onKey);
      input.addEventListener('input', used);
      scroll();
      if (focus) input.focus({ preventScroll: true });
    }

    term.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      if (term.classList.contains('min')) { restore(); return; }
      if (window.getSelection && String(window.getSelection())) return; // allow copying text
      activate(true);
    });
    term.addEventListener('focus', function (e) { if (e.target === term) activate(true); });

    // Auto-activate when the intro demo has finished (~7 s), or right away with reduced motion.
    setTimeout(function () { activate(false); }, reduce ? 0 : 7400);

    // ---------- minimize / restore ----------
    function minimize() {
      activate(false);
      term.classList.add('min');
      title.textContent = 'terminal \u2014 click to restore';
      bar.setAttribute('role', 'button'); bar.setAttribute('tabindex', '0');
    }
    function restore() {
      if (!term.classList.contains('min')) return;
      term.classList.remove('min');
      title.textContent = 'osvaldo@homelab: ~';
      bar.removeAttribute('role'); bar.removeAttribute('tabindex');
      scroll();
      if (input) input.focus({ preventScroll: true });
    }
    bar.addEventListener('keydown', function (e) { if (term.classList.contains('min') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); restore(); } });

    // ---------- commands ----------
    var POSTS = [
      ['Hardening my homelab: 9 findings to 0', '/blog/hardening-my-homelab/'],
      ['Building a home SOC with Wazuh', '/blog/home-soc-with-wazuh/'],
      ['Hosting a hardened website from home with zero open ports', '/blog/zero-open-ports-website/']
    ];
    var HELP = [
      ['help', 'show this list'],
      ['whoami', 'who I am, in a few lines'],
      ['projects', 'what I\u2019m building'],
      ['blog', 'my write-ups'],
      ['contact', 'email, LinkedIn, GitHub'],
      ['ls', 'list files'],
      ['cat <file>', 'print a file (try about.txt)'],
      ['nmap', 'scan this site'],
      ['theme [list|name]', 'change the color theme'],
      ['date / pwd / echo / ping', 'the classics'],
      ['clear', 'clear the screen'],
      ['exit', 'minimize the terminal']
    ];
    var VISIBLE = ['help', 'whoami', 'projects', 'blog', 'contact', 'ls', 'cat', 'nmap', 'theme', 'date', 'pwd', 'echo', 'ping', 'clear', 'exit'];

    function whoami() {
      print('Osvaldo Marino');
      print('First-generation college student at Georgia State University: Computer Information Systems (Cybersecurity concentration), expected Dec 2027.');
      print('Completed the TryHackMe SOC Level 1 path. Studying for CompTIA Security+ (SY0-701), target Dec 2026.');
      print('Runs a self-hosted homelab: Ubuntu server, Wazuh SIEM, Greenbone vulnerability scanning and a hardened website (this one).');
      print('Looking for cybersecurity / SOC analyst internships.', 'g');
    }
    function contact() {
      var d = line(); span(d, 'email     ', 'm'); link(d, 'contact@osvaldomarino.dev', 'mailto:contact@osvaldomarino.dev');
      d = line(); span(d, 'linkedin  ', 'm'); link(d, 'linkedin.com/in/omarino1', 'https://www.linkedin.com/in/omarino1', true);
      d = line(); span(d, 'github    ', 'm'); link(d, 'github.com/oemarino', 'https://github.com/oemarino', true);
      scroll();
    }
    function blog() {
      POSTS.forEach(function (p, i) { var d = line(); span(d, (i + 1) + '. ', 'm'); link(d, p[0], p[1]); });
      scroll();
    }
    function projects() {
      var d = line(); span(d, '\u25b8 ', 'g'); link(d, 'Cybersecurity Homelab', '#homelab');
      span(d, ' \u2014 Ubuntu Server 24.04, ufw default deny, Tailscale, Greenbone/OpenVAS, Wazuh', 'm');
      print('  9 \u2192 0 real Greenbone findings \u00b7 0/1,007 TCP ports open externally \u00b7 Wazuh caught the SSH brute-force test', 'm');
      d = line(); span(d, '  repo: ', 'm'); link(d, 'github.com/oemarino/homelab', 'https://github.com/oemarino/homelab', true);
      d = line(); span(d, '\u25b8 ', 'g'); link(d, 'TryHackMe SOC Level 1 (completed Feb\u2013Jul 2026)', '#homelab');
      print('  4 SOC capstone investigations \u00b7 4 phishing investigation reports \u00b7 MITRE ATT&CK mapping', 'm');
      print('\u25b8 Write-ups:', 'g');
      POSTS.forEach(function (p) { var e = line(); span(e, '  - ', 'm'); link(e, p[0], p[1]); });
      scroll();
    }
    function nmap(target) {
      busy = true;
      var t = target || 'osvaldomarino.dev';
      var now = new Date();
      var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
      print('Starting Nmap ( https://nmap.org ) at ' + stamp);
      var out = [
        ['Nmap scan report for ' + t + ' (Cloudflare edge)'],
        ['Host is up.'],
        ['PORT    STATE SERVICE', 'm'],
        ['80/tcp  open  http     \u2190 Cloudflare\u2019s edge, not my house'],
        ['443/tcp open  https    \u2190 Cloudflare\u2019s edge, not my house'],
        [''],
        ['Origin (homelab server): 0 open ports', 'g'],
        ['  \u2514\u2500 served through an outbound-only tunnel', 'g'],
        ['  \u2514\u2500 outside-in check: 0 of 1,007 TCP ports open', 'g'],
        ['Nmap done: 1 host up. Nothing to see here. \ud83d\ude0e']
      ];
      var i = 0;
      (function step() {
        if (i >= out.length) { busy = false; return; }
        print(out[i][0], out[i][1]); i++;
        later(i < 2 ? 500 : 140, step);
      })();
    }
    function rmrf() {
      busy = true;
      print('rm: descending into / with --no-preserve-root \ud83d\ude2c', 'y');
      var bar = print('', 'r');
      var dirs = ['/boot', '/etc', '/home', '/opt', '/usr', '/var'];
      var n = 0, total = 20;
      function render() {
        var full = Math.round(n / total * 20);
        bar.textContent = '[' + new Array(full + 1).join('\u2588') + new Array(20 - full + 1).join('\u2591') + '] ' +
          Math.round(n / total * 100) + '%  ' + (n < total ? 'deleting ' + dirs[Math.min(dirs.length - 1, Math.floor(n / total * dirs.length))] + ' ...' : 'done');
      }
      function finish() {
        print('Nice try. This incident has been logged to Wazuh. \ud83d\udea8', 'r b');
        print('(Nothing was deleted. This is a website.)', 'm');
        busy = false;
      }
      if (reduce) { n = total; render(); finish(); return; }
      var iv = setInterval(function () { n++; render(); if (n >= total) { clearInterval(iv); setTimeout(finish, 350); } }, 70);
      render();
    }
    function hire() {
      busy = true;
      print('[sudo] password for recruiter: ********');
      later(500, function () {
        print('Permission granted \u2705 Redirecting to contact...', 'g b');
        later(1200, function () {
          busy = false;
          var c = document.getElementById('contact');
          if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
      });
    }
    function theme(arg) {
      var cur = root.getAttribute('data-theme') || 'aurora';
      if (!arg || arg === 'list') {
        print('Themes (current: ' + cur + '):');
        Object.keys(THEMES).forEach(function (k) {
          var d = line();
          SWATCH[k].forEach(function (c) { var s = span(d, '\u25a0', 'sw'); s.style.color = c; });
          span(d, ' ' + (k === cur ? '* ' : '  ') + k + (new Array(9 - k.length).join(' ')), k === cur ? 'g' : '');
          span(d, THEMES[k], 'm');
        });
        print("Usage: theme <name>", 'm');
        scroll(); return;
      }
      if (!THEMES[arg]) { print("theme: unknown theme '" + arg + "'. Try 'theme list'", 'r'); return; }
      applyTheme(arg);
      try { localStorage.setItem('om-theme', arg); } catch (e) {}
      print('Theme set to ' + arg + '. \u2728 Saved for next time.', 'g');
    }
    function matrix() {
      if (reduce) { print('Matrix rain skipped: your system prefers reduced motion.', 'm'); return; }
      if (document.querySelector('.matrix-rain')) return;
      print('Wake up, Neo... (click or press Esc to exit)', 'g');
      var cv = document.createElement('canvas');
      cv.className = 'matrix-rain';
      cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      var ctx = cv.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, cols, drops, fs = 16;
      function size() {
        W = window.innerWidth; H = window.innerHeight;
        cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(W / fs); drops = [];
        for (var i = 0; i < cols; i++) drops.push(Math.random() * -H / fs);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      }
      size();
      var chars = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c80123456789$#@<>/{}';
      var raf, ended = false, start = performance.now(), lastT = 0;
      function frame(t) {
        if (t - lastT > 45) {
          lastT = t;
          ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, W, H);
          ctx.font = fs + 'px ui-monospace, monospace';
          for (var i = 0; i < cols; i++) {
            var y = drops[i] * fs;
            ctx.fillStyle = Math.random() > 0.96 ? '#d1fae5' : '#22c55e';
            ctx.fillText(chars.charAt(Math.floor(Math.random() * chars.length)), i * fs, y);
            if (y > H && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
          }
        }
        if (t - start > 4000) return end();
        raf = requestAnimationFrame(frame);
      }
      function end() {
        if (ended) return; ended = true;
        cancelAnimationFrame(raf);
        cv.classList.add('out');
        document.removeEventListener('keydown', onEsc);
        window.removeEventListener('resize', size);
        setTimeout(function () { if (cv.parentNode) cv.parentNode.removeChild(cv); }, 650);
        print('...back to reality.', 'm');
        if (input) input.focus({ preventScroll: true });
      }
      function onEsc(e) { if (e.key === 'Escape') end(); }
      cv.addEventListener('click', end);
      document.addEventListener('keydown', onEsc);
      window.addEventListener('resize', size);
      raf = requestAnimationFrame(frame);
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function ls(arg) {
      if (arg === 'blog' || arg === 'blog/') return blog();
      if (arg === 'projects' || arg === 'projects/') return projects();
      if (arg) return print('ls: cannot access \'' + arg + '\': No such file or directory', 'r');
      var d = line();
      span(d, 'about.txt  ', ''); span(d, 'projects/  ', 'pa'); span(d, 'blog/  ', 'pa'); span(d, 'contact.txt', '');
      scroll();
    }
    function cat(arg) {
      if (!arg) return print('cat: missing file operand. Try \'cat about.txt\'', 'r');
      if (arg === 'about.txt') return whoami();
      if (arg === 'contact.txt') return contact();
      if (arg === 'projects' || arg === 'blog' || /\/$/.test(arg)) return print('cat: ' + arg + ': Is a directory', 'r');
      print('cat: ' + arg + ': No such file or directory', 'r');
    }

    function run(raw) {
      var cmd = raw.trim().replace(/\s+/g, ' ');
      var low = cmd.toLowerCase();
      var parts = low.split(' '), c = parts[0], rest = cmd.slice(c.length).trim(), restLow = rest.toLowerCase();
      if (!cmd) return;
      if (/^(sudo )?rm -rf \/\*?$/.test(low) || /^(sudo )?rm -rf --no-preserve-root \/$/.test(low)) return rmrf();
      if (/^(sudo )?hire( osvaldo)?$/.test(low)) return hire();
      switch (c) {
        case 'help':
          HELP.forEach(function (h) { var d = line('row2'); span(d, h[0], 'g'); span(d, h[1], 'm'); });
          print('There are a few hidden ones too. \ud83d\udc40', 'y'); scroll(); return;
        case 'clear': while (body.firstChild && body.firstChild !== inputLine) body.removeChild(body.firstChild); return;
        case 'whoami': return whoami();
        case 'projects': return projects();
        case 'blog': return blog();
        case 'contact': return contact();
        case 'ls': return ls(restLow);
        case 'cat': return cat(restLow);
        case 'cd': return print(restLow === '' || restLow === '~' ? '' : 'cd: this is a portfolio, not a filesystem. Try \'ls\'.', 'm');
        case 'pwd': return print('/home/osvaldo');
        case 'date': return print(new Date().toString());
        case 'echo': return print(rest);
        case 'ping': return print('pong');
        case 'nmap': return nmap(parts[1]);
        case 'theme': return theme(parts[1]);
        case 'hack': case 'matrix': return matrix();
        case 'exit': print('logout'); return minimize();
        case 'sudo': return print('[sudo] nice try. Only recruiters get sudo here. \ud83d\ude09', 'y');
        default: print('command not found: ' + c + ". Try 'help'", 'r');
      }
    }

    function complete() {
      var v = input.value.replace(/^\s+/, '').toLowerCase();
      var opts;
      if (/^theme /.test(v)) {
        var p = v.slice(6);
        opts = Object.keys(THEMES).concat('list').filter(function (k) { return k.indexOf(p) === 0; }).map(function (k) { return 'theme ' + k; });
      } else if (/^(cat|ls) /.test(v)) {
        var verb = v.split(' ')[0], q = v.slice(verb.length + 1);
        opts = ['about.txt', 'contact.txt', 'projects/', 'blog/'].filter(function (k) { return k.indexOf(q) === 0; }).map(function (k) { return verb + ' ' + k; });
      } else {
        opts = VISIBLE.filter(function (k) { return k.indexOf(v) === 0; });
      }
      if (opts.length === 1) input.value = opts[0] + (/ $|\/$/.test(opts[0]) || opts[0].indexOf(' ') > -1 ? '' : ' ');
      else if (opts.length > 1) { echoCmd(input.value); print(opts.join('  '), 'm'); }
    }

    function submit() {
      if (busy) return;
      var v = input.value.slice(0, 100);
      input.value = '';
      echoCmd(v);
      if (v.trim()) { history.push(v); if (history.length > 50) history.shift(); used(); }
      hIdx = history.length;
      run(v); scroll();
    }
    var typing = false;
    // Suggestion chips: type the command with a quick typing effect, then run it.
    function typeCmd(c) {
      if (typing || busy) return;
      used();
      if (term.classList.contains('min')) restore();
      activate(false);
      typing = true;
      input.value = '';
      var i = 0;
      function done() { typing = false; submit(); }
      if (reduce) { input.value = c; return done(); }
      (function step() {
        input.value = c.slice(0, ++i);
        if (i < c.length) setTimeout(step, 38); else setTimeout(done, 180);
      })();
    }
    function onKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (typing) return;
        submit();
      } else if (e.key === 'ArrowUp') {
        if (!history.length) return; e.preventDefault();
        hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx];
      } else if (e.key === 'ArrowDown') {
        if (!history.length) return; e.preventDefault();
        hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || '';
      } else if (e.key === 'Tab') {
        if (!input.value.trim()) return; // let Tab move focus when empty (keyboard users)
        e.preventDefault(); complete();
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault(); run('clear');
      } else if (e.key === 'c' && e.ctrlKey && !String(window.getSelection())) {
        e.preventDefault(); echoCmd(input.value + '^C'); input.value = ''; scroll();
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
