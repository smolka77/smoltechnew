#!/bin/bash
# Szybka naprawa nginx pod xtechart.com
set -euo pipefail

APP=/var/www/smoltech.com.ua
DOMAIN=xtechart.com
IP_PUBLIC=213.239.130.251
CONF=/etc/nginx/sites-available/xtechart

echo "=== SMOLTECH naprawa (${DOMAIN}) ==="

if [[ ! -f "$APP/index.html" ]]; then
  echo "BRAK $APP/index.html — najpierw wgraj / rozpakuj smoltech.tar.gz"
  ls -la "$APP" | head -40 || true
  exit 1
fi
echo "index.html: $(wc -c < "$APP/index.html") B"

find "$APP/vps" -type f -exec sed -i 's/\r$//' {} + 2>/dev/null || true
chmod +x "$APP/vps"/*.sh 2>/dev/null || true

PHP_SOCK=""
for f in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php8.1-fpm.sock \
         /run/php/php-fpm.sock /var/run/php/php8.1-fpm.sock /var/run/php/php-fpm.sock; do
  if [[ -S "$f" ]]; then PHP_SOCK="$f"; break; fi
done
if [[ -z "$PHP_SOCK" ]]; then
  echo "Brak PHP-FPM sock"
  ls -la /run/php/ 2>/dev/null || true
  exit 1
fi
echo "PHP-FPM: $PHP_SOCK"

rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/xcloudart
rm -f /etc/nginx/conf.d/*.conf 2>/dev/null || true

CERT=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
KEY=/etc/letsencrypt/live/${DOMAIN}/privkey.pem
if [[ -f "$CERT" && -f "$KEY" && -f "$APP/vps/nginx-https.conf" ]]; then
  cp "$APP/vps/nginx-https.conf" "$CONF"
  echo "Wgrano nginx-https.conf"
else
  cp "$APP/vps/nginx-smoltech.conf" "$CONF"
  echo "Wgrano nginx-smoltech.conf"
fi

sed -i "s|unix:/run/php/php-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"
sed -i "s|unix:/run/php/php[0-9.]*-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"

if grep -qE 'xcloudart\.com' "$CONF"; then
  echo "BLAD: conf ma stara domene xcloudart"
  exit 1
fi

ln -sfn "$CONF" /etc/nginx/sites-enabled/xtechart

chown -R www-data:www-data "$APP"
find "$APP" -type d -exec chmod 755 {} +
find "$APP" -type f -exec chmod 644 {} +
chmod 750 "$APP/_private" "$APP/_private/data" "$APP/_private/sessions" 2>/dev/null || true
chmod 640 "$APP/_private/auth.env" 2>/dev/null || true

nginx -t
systemctl reload nginx
systemctl restart php8.1-fpm 2>/dev/null || systemctl restart php8.2-fpm 2>/dev/null || systemctl restart php-fpm 2>/dev/null || true

echo ""
code=$(curl -s --max-time 15 -o /tmp/st-home.html -w '%{http_code}' http://127.0.0.1/ || echo 000)
echo "http://127.0.0.1/ -> HTTP $code"
curl -sI http://127.0.0.1/ | head -n 12
echo ""
if [[ "$code" != "200" ]]; then
  tail -n 40 /var/log/nginx/error.log 2>/dev/null || true
  exit 1
fi
echo "OK: http://${IP_PUBLIC}/"
echo "Panel: https://${DOMAIN}/panel/"
