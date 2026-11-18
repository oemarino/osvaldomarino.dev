#!/bin/sh
# Full staging build: home page + blog + sitemap. Usage: STAGING=1 ./make.sh   (omit STAGING for the production build)
set -e
cd "$(dirname "$0")"
python3 build.py
python3 build_blog.py
rm -rf site/blog && cp -a out-blog/blog site/blog && cp out-blog/blog.js site/blog.js && cp out-blog/theme.js site/theme.js
sed -i 's#<lastmod>[0-9-]*</lastmod>#<lastmod>2026-10-21</lastmod>#' site/sitemap.xml
echo "site/ ready"
