#!/usr/bin/env bash
# Einmalig nach DNS A-Record dicebudget → Server-IP
set -euo pipefail

CONF_SRC="/home/bottleadmin/projects/kniffel/infra/nginx/dicebudget.bottle-trade.de.conf"
CONF_DST="/etc/nginx/sites-available/dicebudget.bottle-trade.de"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Bitte: sudo bash $0"
  exit 1
fi

cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" /etc/nginx/sites-enabled/dicebudget.bottle-trade.de
rm -f /etc/nginx/sites-enabled/kniffel.bottle-trade.de
rm -f /etc/nginx/sites-available/kniffel.bottle-trade.de

if [[ ! -d "/etc/letsencrypt/live/dicebudget.bottle-trade.de" ]]; then
  echo "==> Certbot nur für dicebudget.bottle-trade.de …"
  certbot --nginx -d dicebudget.bottle-trade.de --non-interactive --agree-tos --redirect \
    --register-unsafely-without-email || certbot --nginx -d dicebudget.bottle-trade.de
fi

nginx -t && systemctl reload nginx
echo "OK: https://dicebudget.bottle-trade.de"
