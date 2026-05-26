#!/usr/bin/env bash
# Nginx + SSL + Frontend für dicebudget.bottle-trade.de (ohne kniffel-Domain)
set -euo pipefail

ROOT="/home/bottleadmin/projects/kniffel"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Bitte: sudo bash $0"
  exit 1
fi

rm -f /etc/nginx/sites-enabled/kniffel.bottle-trade.de
rm -f /etc/nginx/sites-available/kniffel.bottle-trade.de

if [[ ! -d "/etc/letsencrypt/live/dicebudget.bottle-trade.de" ]]; then
  bash "$ROOT/infra/scripts/setup-dicebudget-ssl.sh"
fi

bash "$ROOT/infra/scripts/deploy-frontend-prod.sh"
