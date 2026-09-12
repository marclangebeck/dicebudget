#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/ios/App/App/public"
mkdir -p "$PUBLIC"
sha="$(git -C "$ROOT/.." rev-parse --short HEAD 2>/dev/null || echo unknown)"
printf '%s\n%s\n' "$sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$PUBLIC/ios-web-bundle-stamp.txt"
