#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
HASH="$(git -C "$REPO" rev-parse --short HEAD)"
printf 'NEXT_PUBLIC_TOURNAMENT_BUILD=%s\n' "$HASH" > "$ROOT/.env.production.local"
echo "Build-Stempel: $HASH"
