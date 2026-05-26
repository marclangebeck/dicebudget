#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/bottleadmin/projects/kniffel"
BACKEND="$ROOT/backend"
OWNER="bottleadmin"
SERVICE_SRC="$ROOT/infra/systemd/kniffel-backend.service"
SERVICE_DST="/etc/systemd/system/kniffel-backend.service"

echo "==> Backend bauen …"

run_build() {
  cd "$BACKEND"
  npm install
  npx prisma generate
  npx prisma migrate deploy
  npm run build
}

if [[ "${EUID}" -eq 0 ]]; then
  sudo -u "${OWNER}" bash -c "cd '${BACKEND}' && npm install && npx prisma generate && npx prisma migrate deploy && npm run build"
else
  run_build
fi

install_service() {
  cp "$SERVICE_SRC" "$SERVICE_DST"
  systemctl daemon-reload
  systemctl enable kniffel-backend.service
  systemctl restart kniffel-backend.service
}

if [[ "${EUID}" -eq 0 ]]; then
  install_service
else
  sudo cp "$SERVICE_SRC" "$SERVICE_DST"
  sudo systemctl daemon-reload
  sudo systemctl enable kniffel-backend.service
  sudo systemctl restart kniffel-backend.service
fi

sleep 1
curl -fsS http://127.0.0.1:3020/health | head -c 120
echo ""
echo "Backend läuft auf Port 3020 (Nginx: https://dicebudget.bottle-trade.de/api/)."
