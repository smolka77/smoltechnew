#!/bin/bash
# HTML pages: browser must re-check with the server every time (ETag), so a
# saved edit is visible right away instead of an old copy from the browser.
set -euo pipefail

declare -a done_files=()
declare -a backups=()
for f in /etc/nginx/sites-enabled/*; do
  [[ -f "$f" ]] || continue
  grep -q '/var/www/smoltech.com.ua' "$f" || continue
  real=$(readlink -f "$f")
  if grep -q 'expires -1;' "$real"; then
    echo "OK juz jest: $real"
    continue
  fi
  bak="/root/$(basename "$real").bak-$(date +%s)"
  cp -a "$real" "$bak"
  sed -i 's#^\(\s*\)try_files \$uri \$uri/ =404;\s*$#\1try_files $uri $uri/ =404;\n\1expires -1;#' "$real"
  done_files+=("$real")
  backups+=("$bak")
  echo "Zmieniono: $real"
done

if [[ ${#done_files[@]} -gt 0 ]]; then
  if nginx -t; then
    systemctl reload nginx
    echo "nginx przeladowany"
  else
    echo "BLAD nginx -t - przywracam kopie"
    for i in "${!done_files[@]}"; do cp -a "${backups[$i]}" "${done_files[$i]}"; done
    nginx -t && systemctl reload nginx
    exit 1
  fi
fi
