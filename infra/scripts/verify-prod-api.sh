#!/usr/bin/env bash
# Einmalige Prod-Verifikation (M24) — kein Loop, kein Watcher.
set -euo pipefail

API_BASE="${API_BASE:-https://dicebudget.bottle-trade.de/api}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== dice.budget Prod-Verifikation (M24) ==="
echo "API: $API_BASE"
echo

echo "[1/4] Backend /health …"
health="$(curl -sf "$API_BASE/health")"
echo "$health" | grep -q '"status":"ok"' && echo "  OK: Backend erreichbar" || {
  echo "  FEHLER: Unerwartete Antwort: $health"
  exit 1
}

echo "[2/4] Prisma Migration (extra_yatzy_die_values, solo_secret_token) …"
if command -v npx >/dev/null 2>&1 && [[ -f "$ROOT/backend/prisma/schema.prisma" ]]; then
  (cd "$ROOT/backend" && npx prisma migrate status) || {
    echo "  HINWEIS: migrate status fehlgeschlagen — auf dem Server mit DB-Zugriff prüfen."
  }
else
  echo "  Übersprungen (npx/backend nicht verfügbar)."
fi

echo "[3/4] match-analysis coaching + scoreProgression …"
if [[ -n "${VERIFY_INVITE:-}" && -n "${VERIFY_PLAYER:-}" ]]; then
  analysis_json="$(
    curl -sf "$API_BASE/sessions/invite/${VERIFY_INVITE}/match-analysis?viewerPlayerId=${VERIFY_PLAYER}"
  )"
  echo "$analysis_json" | grep -q '"coaching"' || {
    echo "  FEHLER: coaching fehlt in match-analysis"
    exit 1
  }
  echo "$analysis_json" | grep -q '"scoreProgression"' || {
    echo "  FEHLER: scoreProgression fehlt in match-analysis"
    exit 1
  }
  echo "  OK: coaching und scoreProgression vorhanden (Session ${VERIFY_INVITE})"
else
  echo "  Manuell mit abgeschlossener Multi-Session:"
  echo "  VERIFY_INVITE=CODE VERIFY_PLAYER=PLAYERID bash $0"
  echo "  oder:"
  echo "  curl -s \"$API_BASE/sessions/invite/CODE/match-analysis?viewerPlayerId=PLAYERID\" | grep coaching"
fi

echo "[4/4] Nginx Cache-Header (HTML no-cache) …"
if command -v curl >/dev/null 2>&1; then
  cache_header="$(curl -sI "https://dicebudget.bottle-trade.de/app/" | grep -i '^cache-control:' || true)"
  if [[ -n "$cache_header" ]]; then
    echo "  $cache_header"
    echo "$cache_header" | grep -qi 'no-cache' && echo "  OK: HTML no-cache aktiv" || {
      echo "  HINWEIS: no-cache fehlt — Nutzer: sudo nginx -t && sudo systemctl reload nginx"
    }
  else
    echo "  HINWEIS: Cache-Control nicht ermittelt — nginx reload prüfen."
  fi
fi

echo
echo "Fertig (einmaliger Lauf, kein Polling)."
