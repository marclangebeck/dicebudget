#!/usr/bin/env bash
# Startscreen-Layout umschalten: cinematic (Türen) oder classic (Arena-Kacheln).
# Nutzung: bash infra/scripts/set-home-layout.sh classic|cinematic
set -euo pipefail

ROOT="/home/bottleadmin/projects/kniffel"
ENV_FILE="$ROOT/frontend/.env.production"
LAYOUT="${1:-}"

if [[ "$LAYOUT" != "classic" && "$LAYOUT" != "cinematic" ]]; then
  echo "Usage: bash infra/scripts/set-home-layout.sh classic|cinematic"
  echo ""
  echo "  classic    — ursprünglicher Startscreen (zwei Arena-Kacheln + Hero)"
  echo "  cinematic  — Cinematic Doors (gestapelte Multi/Solo-Türen)"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/frontend/.env.production.example" "$ENV_FILE"
fi

if grep -q '^NEXT_PUBLIC_HOME_LAYOUT=' "$ENV_FILE"; then
  sed -i "s/^NEXT_PUBLIC_HOME_LAYOUT=.*/NEXT_PUBLIC_HOME_LAYOUT=$LAYOUT/" "$ENV_FILE"
else
  printf '\nNEXT_PUBLIC_HOME_LAYOUT=%s\n' "$LAYOUT" >> "$ENV_FILE"
fi

echo "NEXT_PUBLIC_HOME_LAYOUT=$LAYOUT gesetzt in $ENV_FILE"
echo "Frontend-Build starten …"
cd "$ROOT/frontend"
npm run build
echo ""
echo "Fertig. Nginx liefert frontend/out/ — kein sudo nötig."
echo "Sofort im Browser (ohne Rebuild): localStorage.setItem('dicebudget.homeLayout','$LAYOUT'); location.reload();"
