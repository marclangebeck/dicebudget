#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "Xcode: Scheme DiceBudget Tournament (nicht DiceBudget)."
echo "TestFlight: Build-Nummer hoch, Product → Archive → Distribute."
echo "Play nur für Simulator/Kabel ohne TestFlight."
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace 2>/dev/null \
  || env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcodeproj
