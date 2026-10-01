#!/bin/bash
# Bust browser cache of site CSS/JS after an overlay (immutable max-age).
set -euo pipefail
ROOT=/var/www/smoltech.com.ua
STAMP=20261001all1
n=0
while IFS= read -r f; do
  case "$f" in
    */_build/*|*/_src/*|*/_private/*) continue ;;
  esac
  sed -i "s/strona\.css?v=[^\"']*/strona.css?v=${STAMP}/g; s/tlumaczenia\.js?v=[^\"']*/tlumaczenia.js?v=${STAMP}/g; s/strona\.js?v=[^\"']*/strona.js?v=${STAMP}/g" "$f"
  n=$((n+1))
done < <(grep -rl --include='*.html' 'strona.css?v=' "$ROOT" || true)
echo "html $n stamp $STAMP"
