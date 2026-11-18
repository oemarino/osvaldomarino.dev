# osvaldomarino.dev (win7-v2)

This branch is the previous Windows 7 Aero version of the site, kept so nothing from that design is lost.

The current live-design work is on the `main` branch (Notebook theme). Do not merge this branch into `main`.

## Layout

- `site/` — built static site (homepage, blog, JS, fonts, images)
- `src/` — homepage sources (`index.html`, `win7.js`, `boot.js`, `mobile.css`, …)
- `build.py`, `build_blog.py`, `make.sh`, `serve.py` — the v2 build

## Preview

```bash
python3 serve.py
```

or:

```bash
cd site
python3 -m http.server 8000
```
