#!/bin/bash
# Serwuje SMOLTECH po IP / dowolnym Host (bez wymuszania HTTPS domeny).
set -euo pipefail
APP=/var/www/smoltech.com.ua
CONF=/etc/nginx/sites-available/xtechart
SRC="$APP/vps/nginx-tylko-ip.conf"

if [[ ! -f "$SRC" ]]; then
  echo "Brak $SRC — najpierw wgraj plik scp"
  exit 1
fi

rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/conf.d/*.conf 2>/dev/null || true

sed -i 's/\r$//' "$SRC"
cp "$SRC" "$CONF"

PHP_SOCK=""
for f in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php8.1-fpm.sock /run/php/php-fpm.sock; do
  if [[ -S "$f" ]]; then PHP_SOCK="$f"; break; fi
done
[[ -n "$PHP_SOCK" ]] || { echo "Brak PHP sock"; exit 1; }
echo "PHP-FPM: $PHP_SOCK"

sed -i "s|unix:/run/php/php-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"
sed -i "s|unix:/run/php/php[0-9.]*-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"

ln -sfn "$CONF" /etc/nginx/sites-enabled/xtechart
nginx -t
systemctl reload nginx

echo "--- http://127.0.0.1/ ---"
curl -sI http://127.0.0.1/ | head -n 12
echo "--- Host: xtechart.com ---"
curl -sI -H 'Host: xtechart.com' http://127.0.0.1/ | head -n 12
echo "OK:"
echo "http://213.239.130.251/"
echo "https://xtechart.com/"
