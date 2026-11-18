#!/usr/bin/env python3
"""Build dist/ from site/ for deploy.

The server's Content-Security-Policy only allows inline styles
(style-src 'unsafe-inline'), so external stylesheets are blocked.
This copies site/ to dist/ and inlines css/style.css into every HTML page.
Edit site/ as normal, then run: python3 build/make_dist.py
"""
import pathlib, shutil, re
root = pathlib.Path(__file__).resolve().parent.parent
src, dst = root / "site", root / "dist"
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src, dst)
css = (src / "css" / "style.css").read_text()
tag = re.compile(r'<link rel="stylesheet" href="/css/style\.css">')
n = 0
for f in dst.rglob("*.html"):
    t = f.read_text()
    if tag.search(t):
        f.write_text(tag.sub(lambda m: "<style>\n" + css + "\n</style>", t))
        n += 1
print(f"dist/ built, inlined CSS into {n} pages")
