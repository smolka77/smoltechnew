#!/bin/bash
# Tylko /lead. Nie rusza /var/www/smoltech.com.ua ani calego vhosta nginx.
set -euo pipefail

LEAD=/var/www/lead
ZIP=/tmp/xtechart-lead.zip
SNIP=/etc/nginx/snippets/lead-proxy.conf
CONF=/etc/nginx/sites-available/xtechart

mkdir -p "$LEAD" /etc/nginx/snippets

cat > "$SNIP" <<'EOF'
location ^~ /lead {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
location ^~ /_next/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
EOF

python3 - <<'PY'
from pathlib import Path
inc = "    include /etc/nginx/snippets/lead-proxy.conf;\n\n"
p = Path("/etc/nginx/sites-available/xtechart")
t = p.read_text()
marker = "    location / {\n        try_files"
if "snippets/lead-proxy.conf" in t:
    print("nginx: include /lead juz jest")
else:
    t = t.replace(marker, inc + marker)
    p.write_text(t)
    print("nginx: dopisano include /lead (try_files, bez redirectow)")
PY

if [[ -f "$ZIP" ]]; then
  unzip -o "$ZIP" -d "$LEAD"
fi

if [[ ! -f "$LEAD/.env" ]]; then
  printf 'REACH_SECRET=%s\nNEXT_PUBLIC_SITE_URL=https://xtechart.com\nPORT=3001\n' "$(openssl rand -hex 32)" > "$LEAD/.env"
fi
grep -q '^PORT=' "$LEAD/.env" || echo 'PORT=3001' >> "$LEAD/.env"

cd "$LEAD"
command -v npm >/dev/null
npm install
npm run build
command -v pm2 >/dev/null || npm i -g pm2

pm2 delete lead 2>/dev/null || true
PORT=3001 pm2 start npm --name lead --cwd "$LEAD" -- start
pm2 save

nginx -t
systemctl reload nginx

echo "OK /lead. SMOLTECH i panel bez zmian."
curl -sI http://127.0.0.1/ | head -n 1
curl -sI http://127.0.0.1/panel/ | head -n 1
curl -sI http://127.0.0.1/lead | head -n 1
