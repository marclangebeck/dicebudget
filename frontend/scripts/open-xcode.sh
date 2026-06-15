#!/usr/bin/env bash
# Öffnet App.xcworkspace in Xcode (nur macOS).
# Manuell: npm run open:ios
# Nach Build: npm run build:ios (ruft dieses Skript am Ende auf)

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE="$ROOT/ios/App/App.xcworkspace"

if [[ ! -d "$WORKSPACE" ]]; then
  echo "Xcode-Workspace nicht gefunden: $WORKSPACE" >&2
  echo "Zuerst: npm run build && npx cap sync ios" >&2
  exit 1
fi

echo "Öffne Xcode: $WORKSPACE"
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open "$WORKSPACE"
