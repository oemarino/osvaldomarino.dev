#!/usr/bin/env python3
"""Build the osvaldomarino.dev home page (v2) into site/.
Usage:  python3 build.py            -> production-style build
        STAGING=1 python3 build.py  -> staging build (shows the missing-resume placeholder)
Feature toggles (each is a request that conflicts with an earlier preference; flip to False to turn off):"""
import hashlib, json, os, re, shutil
FLAGS = {
    'quiktrip': False,      # Experience: "Store Clerk, QuikTrip, Sept 2022 - Present"
    'resume': False,       # Resume (PDF) button. Only rendered if site/resume.pdf exists (or STAGING=1 as a flagged placeholder)
    'role': True,          # Headline: 'Seeking cybersecurity internships' + Atlanta, GA
    'extra_skills': False,  # "Also familiar with: Wireshark, Python (no public write-up yet)"
}
STAGING = os.environ.get('STAGING') == '1'
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
RESUME_PATH = '/resume.pdf'
have_resume = os.path.exists('site' + RESUME_PATH)

def v(path): return hashlib.sha256(open(path, 'rb').read()).hexdigest()[:10]
shutil.copy('src/win7.js', 'site/win7.js')
# boot.js = theme.js (light/dark, before first paint) + boot.js (layout before first paint)
open('site/boot.js', 'w').write(open('src/theme.js').read() + open('src/boot.js').read())

h = open('src/index.html').read()
# conditional blocks: <!--IF:x--> ... [<!--ELSE:x--> ...] <!--/IF:x-->
def cond(m):
    name, body = m.group(1), m.group(2)
    yes, _, no = body.partition('<!--ELSE:%s-->' % name)
    return yes if FLAGS.get(name) else no
h = re.sub(r'\n?<!--IF:(\w+)-->(.*?)<!--/IF:\1-->', cond, h, flags=re.S)

# resume button: real link if the file exists; flagged placeholder on staging; omitted otherwise
if FLAGS['resume'] and have_resume:
    btn = '<a class="btn7 pri" id="resume-btn" href="%s" target="_blank" rel="noopener">⬇ Resume (PDF)<span class="vh"> (opens in a new tab)</span></a>' % RESUME_PATH
    smr = '<a href="%s" target="_blank" rel="noopener">Resume (PDF) ↗</a>' % RESUME_PATH
elif FLAGS['resume'] and STAGING:
    btn = '<a class="btn7 pri" id="resume-btn" data-missing href="%s" title="Placeholder: resume.pdf has not been provided yet">⬇ Resume (PDF) <span class="miss">FILE MISSING</span></a>' % RESUME_PATH
    smr = '<a href="%s">Resume (PDF) [missing]</a>' % RESUME_PATH
else:
    btn = smr = ''
h = h.replace('{{RESUME_BTN}}', btn).replace('{{RESUME_SM}}', smr)
h = h.replace('{{PROJ_PRI}}', '' if btn else ' pri')

role = FLAGS['role']
h = h.replace('{{SM_SUB}}', 'Cybersecurity student · Atlanta, GA' if role else 'Cybersecurity student')
h = h.replace('{{SM_FOOT}}', 'Seeking cybersecurity internships' if role else 'Seeking cybersecurity internships')
desc = ('Osvaldo Marino, cybersecurity student at Georgia State University (B.B.A. CIS, Cybersecurity, Dec 2027) in Atlanta, GA, '
        'seeking cybersecurity internships. Homelab projects: Greenbone hardening, Wazuh SIEM, self-hosted site.') if role else \
       ('Osvaldo Marino, first-generation cybersecurity student at Georgia State University. Homelab projects: Greenbone hardening, '
        'Wazuh SIEM and a self-hosted website. Seeking cybersecurity internships.')
og = ("Check out my cybersecurity projects, homelab write-ups, and what I'm learning as a first-gen student at Georgia State. "
      "The whole site is self-hosted on my own home server.")
h = h.replace('{{META_DESC}}', desc).replace('{{OG_DESC}}', og)

SITE = 'https://osvaldomarino.dev'
person = {
    '@type': 'Person', '@id': SITE + '/#person', 'name': 'Osvaldo Marino', 'url': SITE + '/',
    'image': SITE + '/img/osvaldo.jpg',
    'jobTitle': 'Cybersecurity student',
    'description': 'Cybersecurity student at Georgia State University building and defending a self-hosted homelab.',
    'alumniOf': {'@type': 'CollegeOrUniversity', 'name': 'Georgia State University', 'url': 'https://www.gsu.edu/'},
    'homeLocation': {'@type': 'Place', 'name': 'Atlanta, Georgia, United States'},
    'knowsAbout': ['Linux administration', 'Vulnerability management', 'Greenbone/OpenVAS', 'Wazuh SIEM', 'Incident triage',
                   'Network security', 'Docker', 'nginx', 'Cloudflare Tunnel', 'MITRE ATT&CK'],
    'sameAs': ['https://github.com/oemarino', 'https://www.linkedin.com/in/omarino1', 'https://tryhackme.com/p/osvaldomarino82'],
}
if role: person['seeks'] = {'@type': 'Demand', 'name': 'Cybersecurity internship', 'areaServed': 'Atlanta, GA'}
ld = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'ProfilePage', '@id': SITE + '/#profile', 'url': SITE + '/', 'name': 'Osvaldo Marino | Cybersecurity Student Portfolio',
     'dateModified': '2026-10-21', 'inLanguage': 'en-US', 'mainEntity': {'@id': SITE + '/#person'}},
    person,
    {'@type': 'WebSite', '@id': SITE + '/#website', 'url': SITE + '/', 'name': 'Osvaldo Marino', 'publisher': {'@id': SITE + '/#person'}},
]}
h = h.replace('{{JSONLD}}', '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')) + '</script>')

# stacked layout CSS, scoped to html.m (set by boot.js) and to no-JS visitors
SCOPE = 'html:is(.m,:not(.js))'
def scope_sel(sel):
    sel = sel.strip()
    if sel.startswith('html'): return SCOPE + sel[4:]
    if sel.startswith('body'): return SCOPE + ' ' + sel
    return SCOPE + ' ' + sel
out = []
for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', open('src/mobile.css').read()):
    sels = ','.join(scope_sel(s) for s in m.group(1).split(','))
    out.append(sels + '{' + m.group(2).strip() + '}')
h = h.replace('{{MOBILE_CSS}}', '\n'.join(out))

h = h.replace('{{V}}', v('site/win7.js')).replace('{{V_BOOT}}', v('site/boot.js')).replace('{{FAVICON}}', open('favicon.txt').read().strip())
assert '{{' not in h, re.findall(r'\{\{\w+\}\}', h)
low = h.lower()
banned = ['raze', 'aerovista', 'gpa', 'gmail', 'involvement', 'languages', 'phone', '104.15.', '192.168.', '100.89.', 'tailnet-name', '8088']
if not FLAGS['quiktrip']: banned.append('quiktrip')
if not FLAGS['resume']: banned += ['resume', '/resume.pdf']
if not FLAGS['extra_skills']: banned += ['wireshark', 'python']
banned += ['security analyst', 'security engineer']  # role targeting is now just 'cybersecurity internships'
for bad in banned: assert bad not in low, bad
assert re.search(r'<script(?![^>]*\bsrc=)(?![^>]*application/ld\+json)[^>]*>', h) is None, 'inline script'
assert not re.search(r'\son[a-z]+=', h), 'inline handler'
open('site/index.html', 'w').write(h)
print('built index.html', len(h), 'bytes | win7.js', v('site/win7.js'), '| resume:', 'file' if have_resume else ('placeholder' if STAGING and FLAGS['resume'] else 'omitted'), '| flags', FLAGS)
