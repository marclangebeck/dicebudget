#!/usr/bin/env bash
# Prüft, dass das Capacitor-Web-Bundle (ios/App/App/public) den aktuellen UI-Stand hat.
# Verhindert Archive mit veraltetem „InApp-Features / Vorschau sperren“-Stand.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/ios/App/App/public"
SETTINGS_CHUNKS="$PUBLIC/_next/static/chunks/app/settings"

if [[ ! -d "$PUBLIC" ]]; then
  echo "FEHLER: $PUBLIC fehlt. Zuerst: npm run build && npx cap sync ios" >&2
  exit 1
fi

if grep -Rql --include='*.js' --include='*.html' -E 'Vorschau sperren|InApp-Features|InApp-Käufe \(Features\)' "$PUBLIC"; then
  echo "FEHLER: Veraltete InApp/Labs-UI noch im iOS-Web-Bundle." >&2
  echo "  → Auf dem Mac/Server: cd frontend && npm run build && npx cap sync ios" >&2
  exit 1
fi

if [[ ! -d "$SETTINGS_CHUNKS" ]] || ! grep -Rql --include='*.js' 'Hausregeln' "$SETTINGS_CHUNKS"; then
  echo "FEHLER: Erwartete Hausregeln-UI fehlt im Settings-Chunk." >&2
  exit 1
fi

STAMP="$PUBLIC/ios-web-bundle-stamp.txt"
if [[ -f "$STAMP" ]]; then
  echo "OK: iOS-Web-Bundle aktuell ($(tr -d '\n' < "$STAMP"))"
else
  echo "OK: iOS-Web-Bundle ohne InApp-Gate (Stamp optional)"
fi

CFG="$ROOT/ios/App/App/capacitor.config.json"
if [[ -f "$CFG" ]]; then
  if ! grep -q 'dicebudget.bottle-trade.de/app' "$CFG"; then
    echo "FEHLER: capacitor.config.json ohne Live-Web server.url — TestFlight driftet sonst wieder." >&2
    exit 1
  fi
  echo "OK: Live-Web server.url gesetzt"
fi
