#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/bottleadmin/projects/kniffel"
FRONTEND="$ROOT/frontend"
OWNER="bottleadmin"
NGINX_SRC="$ROOT/infra/nginx/dicebudget.bottle-trade.de.conf"
NGINX_DST="/etc/nginx/sites-available/dicebudget.bottle-trade.de"

echo "==> Frontend statisch bauen (next export → frontend/out/) …"

export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://dicebudget.bottle-trade.de}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}"

build_frontend() {
  cd "$FRONTEND"
  npm run build
}

if [[ "${EUID}" -eq 0 ]]; then
  chown -R "${OWNER}:${OWNER}" "${FRONTEND}/.next" "${FRONTEND}/out" 2>/dev/null || true
  sudo -u "${OWNER}" env \
    NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
    NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    bash -c "cd '${FRONTEND}' && npm run build"
else
  build_frontend
fi

if [[ ! -f "${FRONTEND}/out/index.html" ]]; then
  echo "FEHLER: out/index.html fehlt nach dem Build."
  exit 1
fi

chown -R "${OWNER}:${OWNER}" "${FRONTEND}/.next" "${FRONTEND}/out" 2>/dev/null || true

nginx_deploy() {
  echo "==> Nginx: dicebudget.bottle-trade.de …"
  cp "$NGINX_SRC" "$NGINX_DST"
  ln -sf "$NGINX_DST" /etc/nginx/sites-enabled/dicebudget.bottle-trade.de
  rm -f /etc/nginx/sites-enabled/kniffel.bottle-trade.de

  echo "==> Nginx testen & neu laden …"
  nginx -t
  systemctl reload nginx
}

if [[ "${EUID}" -eq 0 ]]; then
  nginx_deploy
else
  sudo bash -c "$(declare -f nginx_deploy); nginx_deploy"
fi

sleep 1
curl -fsS -o /dev/null -w "Landing HTTPS: HTTP %{http_code}\n" https://dicebudget.bottle-trade.de/ || true
curl -fsS -o /dev/null -w "App HTTPS: HTTP %{http_code}\n" https://dicebudget.bottle-trade.de/app || true
curl -fsS https://dicebudget.bottle-trade.de/api/health 2>/dev/null | head -c 80 || echo "Hinweis: API /api/health – Backend mit deploy-backend-prod.sh starten"

echo ""
echo "Fertig: https://dicebudget.bottle-trade.de"
echo "Datenschutz (App Store): https://dicebudget.bottle-trade.de/datenschutz"
echo "App-Start: https://dicebudget.bottle-trade.de/app"
echo "API-URL im Build: ${NEXT_PUBLIC_API_URL}"
echo ""
if [[ ! -d "/etc/letsencrypt/live/dicebudget.bottle-trade.de" ]]; then
  echo "SSL fehlt noch — einmalig:"
  echo "  sudo bash ${ROOT}/infra/scripts/setup-dicebudget-ssl.sh"
fi
echo "Backend: sudo bash ${ROOT}/infra/scripts/deploy-backend-prod.sh"
