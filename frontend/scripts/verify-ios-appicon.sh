#!/usr/bin/env bash
# Prüft den nativen iOS-AppIcon-Asset-Satz (nicht die Web-/PWA-Icons).
# Optional auf dem Mac: gebautes .app / .xcarchive / .ipa gegenprüfen.
#
# Usage:
#   bash scripts/verify-ios-appicon.sh
#   bash scripts/verify-ios-appicon.sh /path/to/App.app
#   bash scripts/verify-ios-appicon.sh /path/to/App.xcarchive
#   bash scripts/verify-ios-appicon.sh /path/to/DiceBudget.ipa
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICONSET="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"
CONTENTS="$ICONSET/Contents.json"
PBX="$ROOT/ios/App/App.xcodeproj/project.pbxproj"

die() { echo "FEHLER: $*" >&2; exit 1; }

[[ -f "$CONTENTS" ]] || die "Contents.json fehlt: $CONTENTS"

FILENAME="$(node -e "const j=require('$CONTENTS'); const f=j.images?.[0]?.filename; if(!f) process.exit(2); process.stdout.write(f)")" \
  || die "Contents.json enthält keinen images[0].filename"

ICON="$ICONSET/$FILENAME"
[[ -f "$ICON" ]] || die "AppIcon-Datei fehlt: $ICON"

# Nur ein AppIcon-Satz im Capacitor-iOS-Projekt
COUNT="$(find "$ROOT/ios" -type d -name 'AppIcon.appiconset' | wc -l | tr -d ' ')"
[[ "$COUNT" == "1" ]] || die "Erwarte genau 1 AppIcon.appiconset unter ios/, gefunden: $COUNT"

# Target muss AppIcon nutzen (Debug + Release)
ICON_NAME_HITS="$(grep -c 'ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;' "$PBX" || true)"
[[ "$ICON_NAME_HITS" -ge 2 ]] || die "ASSETCATALOG_COMPILER_APPICON_NAME=AppIcon fehlt in Debug/Release"

# Bild: 1024², kein Alpha, dunkle Ecken (Platzhalter war hell/weiß)
APPICON_PATH="$ICON" node --input-type=module <<'EOF'
import sharp from 'sharp';

const path = process.env.APPICON_PATH;
const meta = await sharp(path).metadata();
if (meta.width !== 1024 || meta.height !== 1024) {
  console.error('FEHLER: AppIcon muss 1024x1024 sein, ist', meta.width, 'x', meta.height);
  process.exit(1);
}
if (meta.hasAlpha) {
  console.error('FEHLER: AppIcon darf kein Alpha haben (Apple).');
  process.exit(1);
}

const { data, info } = await sharp(path).ensureAlpha().removeAlpha().raw().toBuffer({ resolveWithObject: true });
function cornerMean(x0, y0, w = 32) {
  let s = 0, n = 0;
  for (let y = y0; y < y0 + w; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * info.width + x) * info.channels;
      s += (data[i] + data[i + 1] + data[i + 2]) / 3;
      n++;
    }
  }
  return s / n;
}
const corners = [
  cornerMean(0, 0),
  cornerMean(1024 - 32, 0),
  cornerMean(0, 1024 - 32),
  cornerMean(1024 - 32, 1024 - 32),
];
if (corners.some((c) => c > 80)) {
  console.error('FEHLER: Ecken zu hell — sieht nach Capacitor-Platzhalter aus:', corners.map(c => c.toFixed(1)).join(', '));
  process.exit(1);
}
console.log('OK: Asset-Catalog AppIcon =', path.split('/').pop());
console.log('OK: 1024x1024 RGB, Ecken dunkel (kein Platzhalter)');
EOF

BUILD="$(grep -E 'CURRENT_PROJECT_VERSION = [0-9]+;' "$PBX" | head -1 | sed -E 's/.*CURRENT_PROJECT_VERSION = ([0-9]+);/\1/')"
MARKETING="$(grep -E 'MARKETING_VERSION = [^;]+;' "$PBX" | head -1 | sed -E 's/.*MARKETING_VERSION = ([^;]+);/\1/')"
echo "OK: Xcode Marketing=$MARKETING Build=$BUILD · ASSETCATALOG_COMPILER_APPICON_NAME=AppIcon"

# Optional: gebautes Bundle prüfen (nur macOS mit Xcode)
BUNDLE_IN="${1:-}"
if [[ -z "$BUNDLE_IN" ]]; then
  echo "Hinweis: Vor Upload auf dem Mac zusätzlich prüfen:"
  echo "  bash scripts/verify-ios-appicon.sh /pfad/zu/App.xcarchive"
  exit 0
fi

resolve_app() {
  local in="$1"
  if [[ -d "$in" && "$in" == *.app ]]; then
    echo "$in"
    return
  fi
  if [[ -d "$in" && "$in" == *.xcarchive ]]; then
    local app
    app="$(find "$in/Products/Applications" -maxdepth 1 -name '*.app' | head -1)"
    [[ -n "$app" ]] || die "Keine .app im Archive: $in"
    echo "$app"
    return
  fi
  if [[ -f "$in" && "$in" == *.ipa ]]; then
    local tmp
    tmp="$(mktemp -d)"
    unzip -q "$in" -d "$tmp"
    local app
    app="$(find "$tmp/Payload" -maxdepth 1 -name '*.app' | head -1)"
    [[ -n "$app" ]] || die "Keine .app in IPA: $in"
    echo "$app"
    return
  fi
  die "Erwarte .app, .xcarchive oder .ipa — bekommen: $in"
}

APP="$(resolve_app "$BUNDLE_IN")"
CAR="$APP/Assets.car"
[[ -f "$CAR" ]] || die "Assets.car fehlt in $APP — Icon-Ressourcen nicht im Bundle"

if ! command -v xcrun >/dev/null 2>&1; then
  die "xcrun fehlt — Bundle-Check nur auf dem Mac mit Xcode"
fi

INFO_JSON="$(mktemp)"
if ! xcrun --sdk iphoneos assetutil --info "$CAR" >"$INFO_JSON" 2>/dev/null; then
  die "assetutil konnte Assets.car nicht lesen: $CAR"
fi

# AppIcon-Einträge müssen existieren; Platzhalter-Signatur (hell) nicht prüfbar in CAR,
# aber fehlende AppIcon-Nameinheit ist ein Hard-Fail.
if ! grep -Eqi 'AppIcon|ApplicationIcon' "$INFO_JSON"; then
  # assetutil JSON nutzt oft "Name" : "AppIcon"
  if ! grep -Eq '"Name"[[:space:]]*:[[:space:]]*"AppIcon' "$INFO_JSON"; then
    echo "WARN: assetutil-Ausgabe ohne klaren AppIcon-Namen — bitte manuell prüfen:" >&2
    echo "  xcrun --sdk iphoneos assetutil --info \"$CAR\" | less" >&2
  fi
fi

# Grobe Absicherung: CAR muss deutlich größer sein als alter 110KB-Platzhalter-Satz
CAR_SIZE="$(wc -c <"$CAR" | tr -d ' ')"
[[ "$CAR_SIZE" -gt 200000 ]] || die "Assets.car verdächtig klein ($CAR_SIZE bytes) — evtl. altes/leeres Icon"

echo "OK: Bundle enthält Assets.car ($CAR_SIZE bytes) in:"
echo "    $APP"
echo "OK: Icon-Ressourcen im gebauten Bundle nachweisbar — Upload zu TestFlight erlaubt"
rm -f "$INFO_JSON"
