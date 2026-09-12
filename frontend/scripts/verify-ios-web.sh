#!/usr/bin/env bash
# Prüft, dass das Capacitor-Web-Bundle (ios/App/App/public) den aktuellen UI-Stand hat
# und KEIN Live-Web server.url gesetzt ist (Bundle-Modus).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/ios/App/App/public"
SETTINGS_CHUNKS="$PUBLIC/_next/static/chunks/app/settings"
CFG="$ROOT/ios/App/App/capacitor.config.json"

if [[ ! -d "$PUBLIC" ]]; then
  echo "FEHLER: $PUBLIC fehlt. Zuerst: npm run build && npx cap sync ios" >&2
  exit 1
fi

if [[ -f "$CFG" ]] && grep -q '"url"' "$CFG"; then
  echo "FEHLER: capacitor.config.json enthält server.url — Bundle-Modus verlangt eingebettete UI." >&2
  echo "  Entferne server.url (siehe capacitor.config.ts) und erneut: npx cap sync ios" >&2
  exit 1
fi

if grep -Rql --include='*.js' --include='*.html' -E 'Vorschau sperren|InApp-Features|InApp-Käufe \(Features\)' "$PUBLIC"; then
  echo "FEHLER: Veraltete InApp/Labs-UI noch im iOS-Web-Bundle." >&2
  echo "  → cd frontend && npm run build && npx cap sync ios" >&2
  exit 1
fi

if [[ ! -d "$SETTINGS_CHUNKS" ]] || ! grep -Rql --include='*.js' 'Hausregeln' "$SETTINGS_CHUNKS"; then
  echo "FEHLER: Erwartete Hausregeln-UI fehlt im Settings-Chunk." >&2
  exit 1
fi

STAMP="$PUBLIC/ios-web-bundle-stamp.txt"
if [[ -f "$STAMP" ]]; then
  echo "OK: iOS-Web-Bundle aktuell ($(tr '\n' ' ' < "$STAMP"))"
else
  echo "OK: iOS-Web-Bundle (Hausregeln, kein InApp-Gate)"
fi
echo "OK: Bundle-Modus (kein server.url)"
