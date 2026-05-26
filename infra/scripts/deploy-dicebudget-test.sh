#!/usr/bin/env bash
set -euo pipefail

CONF_SRC="/home/bottleadmin/projects/kniffel/infra/nginx/dicebudget.bottle-trade.de.conf"
CONF_DST="/etc/nginx/sites-available/dicebudget.bottle-trade.de"
ENABLED="/etc/nginx/sites-enabled/dicebudget.bottle-trade.de"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Bitte: sudo bash $0"
  exit 1
fi

cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" "$ENABLED"
rm -f /etc/nginx/sites-enabled/kniffel.bottle-trade.de

nginx -t && systemctl reload nginx

if ! curl -fsS -o /dev/null "http://127.0.0.1/" -H "Host: dicebudget.bottle-trade.de"; then
  echo "Hinweis: HTTP-Test fehlgeschlagen."
fi

if [[ ! -d "/etc/letsencrypt/live/dicebudget.bottle-trade.de" ]]; then
  echo "==> Certbot für dicebudget.bottle-trade.de …"
  certbot --nginx -d dicebudget.bottle-trade.de --non-interactive --agree-tos --redirect \
    --register-unsafely-without-email || certbot --nginx -d dicebudget.bottle-trade.de
  nginx -t && systemctl reload nginx
fi

echo "OK: https://dicebudget.bottle-trade.de"
