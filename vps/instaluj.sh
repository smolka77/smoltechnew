#!/bin/bash
# SMOLTECH na VPS — domena xtechart.com
# Katalog: /var/www/smoltech.com.ua
set -euo pipefail

APP=/var/www/smoltech.com.ua
BACKUP=/root/smoltech-private-keep
DOMAIN=xtechart.com
IP_PUBLIC=213.239.130.251
export DEBIAN_FRONTEND=noninteractive

echo "============================================"
echo "  SMOLTECH — http://${IP_PUBLIC}/"
echo "============================================"

if [[ ! -f "$APP/index.html" ]]; then
  echo "Brak $APP/index.html — najpierw rozpakuj paczke."
  ls -la "$APP" | head -50 || true
  exit 1
fi

find "$APP/vps" -type f -exec sed -i 's/\r$//' {} + 2>/dev/null || true
chmod +x "$APP/vps"/*.sh 2>/dev/null || true

echo ""
echo "[1/6] Stop starego OF (Python) + paczki..."
systemctl stop xcloudart 2>/dev/null || true
systemctl disable xcloudart 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

apt-get update -y
apt-get install -y nginx curl ca-certificates tar \
  php-fpm php-cli php-mbstring php-xml php-curl php-zip

systemctl enable php8.1-fpm 2>/dev/null || systemctl enable php8.2-fpm 2>/dev/null || systemctl enable php8.3-fpm 2>/dev/null || systemctl enable php-fpm 2>/dev/null || true
systemctl restart php8.1-fpm 2>/dev/null || systemctl restart php8.2-fpm 2>/dev/null || systemctl restart php8.3-fpm 2>/dev/null || systemctl restart php-fpm 2>/dev/null || true
systemctl enable nginx >/dev/null 2>&1 || true
systemctl start nginx >/dev/null 2>&1 || true

if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

echo ""
echo "[2/6] Socket PHP-FPM..."
PHP_SOCK=""
for f in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php8.1-fpm.sock \
         /run/php/php-fpm.sock /var/run/php/php8.1-fpm.sock /var/run/php/php-fpm.sock; do
  if [[ -S "$f" ]]; then
    PHP_SOCK="$f"
    break
  fi
done
if [[ -z "$PHP_SOCK" ]]; then
  echo "Brak socketa PHP-FPM."
  ls -la /run/php/ 2>/dev/null || true
  exit 1
fi
echo "PHP-FPM: $PHP_SOCK"

echo ""
echo "[3/6] Uprawnienia + przywrocenie danych z KEEP..."
mkdir -p "$APP/_private/data" "$APP/_private/sessions" /var/www/html
find "$APP/_private/sessions" -type f ! -name '.htaccess' ! -name 'index.php' -delete 2>/dev/null || true

if [[ -d "$BACKUP" ]]; then
  if [[ -f "$BACKUP/auth.env" ]]; then
    cp -a "$BACKUP/auth.env" "$APP/_private/auth.env"
    echo "Przywrocono auth.env z serwera."
  fi
  if [[ -f "$BACKUP/magazyn.php" ]]; then
    cp -a "$BACKUP/magazyn.php" "$APP/_private/data/magazyn.php"
    echo "Przywrocono skrzynke (magazyn.php)."
  fi
  if [[ -f "$BACKUP/zapytania.json" ]]; then
    cp -a "$BACKUP/zapytania.json" "$APP/_private/data/zapytania.json"
  fi
  if [[ -f "$BACKUP/limity-logowan.json" ]]; then
    cp -a "$BACKUP/limity-logowan.json" "$APP/_private/data/limity-logowan.json"
  fi
fi

if [[ ! -f "$APP/_private/auth.env" ]]; then
  echo "UWAGA: brak _private/auth.env — panel sie nie zaloguje."
fi

chown -R www-data:www-data "$APP"
find "$APP" -type d -exec chmod 755 {} +
find "$APP" -type f -exec chmod 644 {} +
chmod 750 "$APP/_private" "$APP/_private/data" "$APP/_private/sessions"
chmod 640 "$APP/_private/auth.env" 2>/dev/null || true
chmod 640 "$APP/_private/data/"* 2>/dev/null || true

echo "index.html: $(wc -c < "$APP/index.html") bajtow"

echo ""
echo "[4/6] Nginx: ${DOMAIN}..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/conf.d /etc/nginx/snippets
if [[ -f "$APP/vps/lead-proxy.conf" ]]; then
  cp "$APP/vps/lead-proxy.conf" /etc/nginx/snippets/lead-proxy.conf
fi

rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/default
rm -f /etc/nginx/sites-available/xcloudart
rm -f /etc/nginx/conf.d/*.conf 2>/dev/null || true

CERT=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
KEY=/etc/letsencrypt/live/${DOMAIN}/privkey.pem
CONF=/etc/nginx/sites-available/xtechart

if [[ -f "$CERT" && -f "$KEY" && -f "$APP/vps/nginx-https.conf" ]]; then
  cp "$APP/vps/nginx-https.conf" "$CONF"
  echo "Wgrano nginx-https.conf (HTTP+HTTPS, ${DOMAIN})"
elif [[ -f "$APP/vps/nginx-smoltech.conf" ]]; then
  cp "$APP/vps/nginx-smoltech.conf" "$CONF"
  echo "Wgrano nginx-smoltech.conf (HTTP, cert ${DOMAIN} jeszcze nie ma)"
else
  echo "BLAD: brak confa nginx w $APP/vps/"
  exit 1
fi

sed -i "s|unix:/run/php/php-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"
sed -i "s|unix:/run/php/php[0-9.]*-fpm.sock|unix:${PHP_SOCK}|g" "$CONF"

if grep -q '5173' "$CONF"; then
  echo "BLAD: w confie zostalo proxy 5173."
  exit 1
fi
if ! grep -q "root /var/www/smoltech.com.ua" "$CONF"; then
  echo "BLAD: brak root SMOLTECH w confie."
  grep -n 'root ' "$CONF" || true
  exit 1
fi
if grep -qE 'xcloudart\.com' "$CONF"; then
  echo "BLAD: conf nadal ma xcloudart.com"
  exit 1
fi

ln -sfn "$CONF" /etc/nginx/sites-enabled/xtechart
echo "sites-enabled:"
ls -la /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

echo ""
echo "[5/6] Smoke test (po IP, bez -L)..."
code="$(curl -s --max-time 15 --http1.1 -o /tmp/st-home.html -w '%{http_code}' http://127.0.0.1/ 2>/dev/null || echo 000)"
php_code="$(curl -s --max-time 15 --http1.1 -o /dev/null -w '%{http_code}' http://127.0.0.1/panel/ 2>/dev/null || echo 000)"
priv="$(curl -s --max-time 15 --http1.1 -o /dev/null -w '%{http_code}' http://127.0.0.1/_private/auth.env 2>/dev/null || echo 000)"
loc="$(curl -sI --max-time 15 --http1.1 http://127.0.0.1/ 2>/dev/null | tr -d '\r' | awk 'tolower($1)=="location:"{print $2; exit}')"

echo "GET /        -> HTTP $code"
echo "GET /panel/  -> HTTP $php_code"
echo "GET /_private/auth.env -> HTTP $priv (oczekiwane 403/401)"
echo "Location: ${loc:-(brak)}"
echo "index.html na dysku: $(wc -c < "$APP/index.html") B"

if [[ "$code" != "200" ]]; then
  echo "BLAD: strona nie oddaje 200 (kod $code)."
  tail -n 40 /var/log/nginx/error.log 2>/dev/null || true
  ls -la "$APP" | head -30 || true
  exit 1
fi
if [[ -n "${loc}" && "$loc" == *xcloudart* ]]; then
  echo "BLAD: nadal redirect na stara domene xcloudart ($loc)"
  exit 1
fi
if [[ "$php_code" != "200" && "$php_code" != "302" && "$php_code" != "301" ]]; then
  echo "UWAGA: panel nie oddaje 200 (kod $php_code). Sprawdz PHP-FPM."
  tail -n 20 /var/log/nginx/error.log 2>/dev/null || true
fi
if [[ "$priv" == "200" ]]; then
  echo "BLAD: _private jest publiczne!"
  exit 1
fi

echo ""
echo "[6/6] GOTOWE."
echo "OK: SMOLTECH pod http://${IP_PUBLIC}/ i https://${DOMAIN}/"
echo "Panel: https://${DOMAIN}/panel/"
echo "GOTOWE"
