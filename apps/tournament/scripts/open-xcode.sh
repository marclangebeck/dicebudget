#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "Xcode öffnet sich. Scheme „DiceBudget Tournament“, iPad wählen, Play drücken."
echo "Nur cap sync reicht nicht — die App auf dem Gerät bleibt sonst die alte."
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace 2>/dev/null \
  || env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcodeproj
