# osvaldomarino.dev

Personal portfolio of [Osvaldo Marino](https://osvaldomarino.dev), a cybersecurity student at Georgia State University. The live site is self-hosted from a homelab server behind a Cloudflare Tunnel.

This repository is the **Notebook** version of the site — a clean, card-based layout that’s easy to edit in Cursor. The previous Windows 7 desktop version is preserved on the `win7-v2` branch.

Homelab configs and longer write-ups also live in [oemarino/homelab](https://github.com/oemarino/homelab).

## Folder layout

```
site/                  # What gets served (static HTML, CSS, fonts)
  index.html           # Homepage
  css/style.css        # Shared Notebook styles
  fonts/               # IBM Plex Sans
  blog/                # Write-ups (generated)
  favicon.svg / .ico
  robots.txt / sitemap.xml
build/
  build_blog.py        # Rebuilds site/blog from the post bodies
  posts/               # Article HTML for each write-up (edit these)
```

## Preview locally

From this repository:

```bash
cd site
python3 -m http.server 8000
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Root-relative links (`/blog/`, `/css/style.css`) need the site served from the `site/` folder, so don’t start the server from the repo root.

After you edit a write-up in `build/posts/`, rebuild the blog pages:

```bash
python3 build/build_blog.py
```

The homepage (`site/index.html` and `site/css/style.css`) is edited directly.

## How deploy works (not set up from this repo)

On the homelab server, keep a git checkout of this repository, run `git pull`, then sync the `site/` folder into `/opt/website/site` (for example with `rsync`). The server’s existing nginx container and Cloudflare Tunnel already serve that directory. This README only describes the process — don’t change the server or Cloudflare until a deploy is explicitly approved.

## Updating the site when projects change

When a homelab project, cert, or result changes, update the matching homepage section and, if needed, the write-up in `build/posts/`. Then rebuild the blog and commit the generated HTML with the source.
