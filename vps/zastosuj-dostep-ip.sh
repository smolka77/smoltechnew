#!/bin/bash
set -euo pipefail
APP=/var/www/smoltech.com.ua
CONF=/etc/nginx/sites-available/xtechart
SRC="$APP/vps/nginx-https.conf"

# Wyrzuc obce vhosty (stare redirecty)
rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/conf.d/*.conf 2>/dev/null || true

sed -i 's/\r$//' "$SRC"
cp "$SRC" "$CONF"

PHP_SOCK=""
for f in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php8.1-fpm.sock /run/php/php-fpm.sock; do
  if [[ -S "$f" ]]; then PHP_SOCK="$f"; break; fi
done
if [[ -z "$PHP_SOCK" ]]; then
  echo "Brak PHP-FPM sock"
  exit 1
fi
echo "PHP-FPM: $PHP_SOCK"

sed -i "s|unix:/run/php/php-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"
sed -i "s|unix:/run/php/php[0-9.]*-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"

ln -sfn "$CONF" /etc/nginx/sites-enabled/xtechart
nginx -t
systemctl reload nginx

echo "--- naglowki po IP ---"
curl -sI -H 'Host: 213.239.130.251' http://127.0.0.1/ | head -n 15
echo "--- kod ---"
curl -s -o /dev/null -w 'IP HTTP %{http_code}\n' -H 'Host: 213.239.130.251' http://127.0.0.1/
echo "Otworz: https://xtechart.com/"
