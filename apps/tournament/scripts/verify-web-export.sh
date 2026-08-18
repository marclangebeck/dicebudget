#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KIND="${1:-out}"

if [[ "$KIND" == "ios-public" ]]; then
  TARGET="$ROOT/ios/App/App/public"
else
  TARGET="$ROOT/out"
fi

if [[ ! -d "$TARGET" ]]; then
  echo "Export fehlt: $TARGET" >&2
  echo "Ohne diesen Ordner wäre das nächste Archive die alte UI." >&2
  exit 1
fi

if ! grep -Rqs --binary-files=text "t-cockpit-grid" "$TARGET"; then
  echo "Cockpit-UI nicht in $TARGET (kein t-cockpit-grid)." >&2
  echo "Next.js hat vermutlich ins falsche out/ geschrieben. Archive abbrechen." >&2
  exit 1
fi

echo "OK: Cockpit-UI in $TARGET"
