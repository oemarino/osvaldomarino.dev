#!/usr/bin/env python3
"""Rebuild site/blog pages in the Notebook theme.

Run from the repository root:

    python3 build/build_blog.py

Post bodies live in build/posts/<slug>.html (the article header + prose).
Edit those files, then rerun this script.
"""
from __future__ import annotations

import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
POST_DIR = Path(__file__).resolve().parent / "posts"

POSTS = [
    dict(
        slug="hardening-my-homelab",
        title="Hardening my homelab: 9 findings to 0",
        desc="How I took a Greenbone/OpenVAS scan of my homelab server from 9 Medium/Low findings to 0 real findings, with the before/after numbers.",
        tag="Vulnerability management",
        blurb="Greenbone found 6 Medium and 3 Low issues on my server. I fixed or contained every real one and proved the last one is a false positive.",
        date=("2026-10-20", "October 20, 2026"),
    ),
    dict(
        slug="home-soc-with-wazuh",
        title="Building a home SOC with Wazuh",
        desc="A single-node Wazuh 4.14.9 SIEM, an isolated DVWA/Juice Shop attack lab, and what it did and did not detect.",
        tag="Detection & SIEM",
        blurb="I deployed Wazuh, attacked my own isolated lab, and wrote down what the SIEM caught, including the SQL injection it missed.",
        date=("2026-10-20", "October 20, 2026"),
    ),
    dict(
        slug="zero-open-ports-website",
        title="Hosting a hardened website from home with zero open ports",
        desc="How osvaldomarino.dev runs from my homelab in a locked-down nginx container behind a Cloudflare Tunnel, with no port forwards.",
        tag="Secure hosting",
        blurb="This site runs on my homelab server, but my router has no port forward for it. Here's the container, header and tunnel setup.",
        date=("2026-10-20", "October 20, 2026"),
    ),
    dict(
        slug="simulated-attack-incident-report",
        title="Incident report: attacking my own lab and grading my SIEM",
        desc="A controlled, multi-stage web attack against my isolated DVWA/Juice Shop lab, written up as a SOC incident report: what Wazuh caught, including my custom SQLi rule, and what it missed.",
        tag="Incident response",
        blurb="I ran a controlled recon + SQLi/XSS/LFI attack chain against my isolated lab and wrote it up like a real SOC case, gaps included.",
        date=("2026-10-26", "October 26, 2026"),
    ),
]

NAV = """      <a href="/">About</a>
      <a href="/#projects">Projects</a>
      <a href="/#experience">Experience</a>
      <a href="/blog/">Write-ups</a>
      <a href="/#contact">Contact</a>"""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="author" content="Osvaldo Marino">
<link rel="stylesheet" href="/css/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="canonical" href="{canonical}">
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<div class="wrap">
  <header class="site">
    <a class="mark" href="/">osvaldomarino.dev</a>
    <nav aria-label="Primary">
{nav}
    </nav>
  </header>
  <main id="content">
"""

FOOT = """  </main>
</div>
<footer>
  <p>This site is self-hosted on my homelab server. <a href="/blog/zero-open-ports-website/">How I host it</a>.</p>
  <p style="margin-top:.45rem">Osvaldo Marino · Cybersecurity student · Atlanta, GA</p>
</footer>
</body>
</html>
"""


def page(title: str, desc: str, canonical: str, body: str) -> str:
    return (
        HEAD.format(
            title=html.escape(title),
            desc=html.escape(desc),
            canonical=canonical,
            nav=NAV,
        )
        + body
        + FOOT
    )


def write_index() -> None:
    items = []
    for p in POSTS:
        items.append(
            f'''      <article class="card post">
        <h3><a href="/blog/{p["slug"]}/">{html.escape(p["title"])}</a></h3>
        <p class="when">{p["date"][1]}</p>
        <p>{html.escape(p["blurb"])}</p>
      </article>'''
        )
    body = f"""    <div class="section-head" style="margin-top:.2rem">
      <h1 id="writeups-h" style="font-size:1.8rem;margin:0 0 .4rem">Write-ups</h1>
      <p class="note">Hands-on write-ups from my cybersecurity homelab. Sanitized configs are on <a href="https://github.com/oemarino/homelab" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
    </div>
    <section class="posts" aria-labelledby="writeups-h">
{chr(10).join(items)}
    </section>
    <p class="site-note" style="margin-top:1.2rem;padding:0 .2rem">This site is self-hosted on my homelab server. <a href="/blog/zero-open-ports-website/">How I host it</a>.</p>
"""
    out = SITE / "blog" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        page(
            "Write-ups | Osvaldo Marino",
            "Hands-on cybersecurity write-ups by Osvaldo Marino: Greenbone hardening, a Wazuh home SOC, a simulated-attack incident report, and self-hosting with zero open ports.",
            "https://osvaldomarino.dev/blog/",
            body,
        )
    )


def write_posts() -> None:
    for i, p in enumerate(POSTS):
        src = POST_DIR / f"{p['slug']}.html"
        if not src.exists():
            raise SystemExit(f"Missing post body: {src}")
        article = src.read_text()
        prev = POSTS[i - 1] if i else None
        nxt = POSTS[i + 1] if i + 1 < len(POSTS) else None
        prev_l = (
            f'<a href="/blog/{prev["slug"]}/">← {html.escape(prev["title"])}</a>'
            if prev
            else '<a href="/blog/">← All write-ups</a>'
        )
        next_l = (
            f'<a href="/blog/{nxt["slug"]}/">{html.escape(nxt["title"])} →</a>'
            if nxt
            else '<a href="/">Home →</a>'
        )
        body = f"""    <article class="card article-card">
{article}
      <nav class="post-nav" aria-label="Post">
        <span>{prev_l}</span>
        <span>{next_l}</span>
      </nav>
    </article>
"""
        outdir = SITE / "blog" / p["slug"]
        outdir.mkdir(parents=True, exist_ok=True)
        (outdir / "index.html").write_text(
            page(
                f'{p["title"]} | Osvaldo Marino',
                p["desc"],
                f'https://osvaldomarino.dev/blog/{p["slug"]}/',
                body,
            )
        )


def main() -> None:
    write_index()
    write_posts()
    print(f"Wrote {len(POSTS)} posts and site/blog/index.html")


if __name__ == "__main__":
    main()
