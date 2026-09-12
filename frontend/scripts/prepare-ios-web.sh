#!/usr/bin/env bash
# Baut Web, sync nach ios/App/App/public, schreibt Stamp, verifiziert UI.
# Auf dem Server: für Git-Commit des Bundles (ohne Prod-Admin-PIN).
# Auf dem Mac vor Archive: npm run build:ios (nutzt .env.production mit Admin-PIN).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-release}" # release | scrubbed

stamp_bundle() {
  local sha
  sha="$(git -C "$ROOT/.." rev-parse --short HEAD 2>/dev/null || echo unknown)"
  printf '%s\n%s\n' "$sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$ROOT/ios/App/App/public/ios-web-bundle-stamp.txt"
}

if [[ "$MODE" == "scrubbed" ]]; then
  echo "==> Build (scrubbed NEXT_PUBLIC Admin/Labs für Git-Bundle) …"
  env \
    NEXT_PUBLIC_SITE_URL=https://dicebudget.bottle-trade.de \
    NEXT_PUBLIC_API_URL=/api \
    NEXT_PUBLIC_API_URL_NATIVE=https://dicebudget.bottle-trade.de/api \
    NEXT_PUBLIC_HOME_LAYOUT=cinematic \
    NEXT_PUBLIC_APP_VERSION=2.0 \
    NEXT_PUBLIC_APP_BUILD=ios-bundle \
    NEXT_PUBLIC_ADMIN_PIN= \
    NEXT_PUBLIC_LABS_PIN= \
    NEXT_PUBLIC_ADMIN_API_KEY= \
    npm run build
else
  echo "==> Build (.env.production / aktuelle Env) …"
  npm run build
fi

echo "==> cap sync ios …"
npx cap sync ios
stamp_bundle
bash "$ROOT/scripts/verify-ios-web.sh"
echo "==> Fertig: ios/App/App/public ist synchron."
