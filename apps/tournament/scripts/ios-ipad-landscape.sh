#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$ROOT/ios/App/App/Info.plist"
PBX="$ROOT/ios/App/App.xcodeproj/project.pbxproj"

if [[ ! -f "$PLIST" ]]; then
  echo "Info.plist fehlt: $PLIST" >&2
  echo "Zuerst: npx cap add ios (einmalig auf dem Mac)." >&2
  exit 1
fi

PB=/usr/libexec/PlistBuddy
if [[ ! -x "$PB" ]]; then
  echo "PlistBuddy nicht gefunden — Landscape-Lock übersprungen." >&2
  exit 1
fi

"$PB" -c "Delete :UISupportedInterfaceOrientations~ipad" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :UISupportedInterfaceOrientations~ipad array" "$PLIST"
"$PB" -c "Add :UISupportedInterfaceOrientations~ipad:0 string UIInterfaceOrientationLandscapeLeft" "$PLIST"
"$PB" -c "Add :UISupportedInterfaceOrientations~ipad:1 string UIInterfaceOrientationLandscapeRight" "$PLIST"
"$PB" -c "Delete :UIRequiresFullScreen" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :UIRequiresFullScreen bool true" "$PLIST"

if [[ -f "$PBX" ]]; then
  python3 - "$PBX" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
text = text.replace('TARGETED_DEVICE_FAMILY = "1";', 'TARGETED_DEVICE_FAMILY = "1,2";')
ipad_value = "UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight"


def upsert_key(src: str, key: str, value: str) -> str:
    lines = []
    found = False
    for line in src.splitlines(True):
        if f"{key} =" in line:
            indent = line[: len(line) - len(line.lstrip())]
            lines.append(f"{indent}{key} = {value};\n")
            found = True
        else:
            lines.append(line)
    src = "".join(lines)
    if found:
        return src
    return src.replace(
        "GENERATE_INFOPLIST_FILE = YES;",
        f"GENERATE_INFOPLIST_FILE = YES;\n\t\t\t\t{key} = {value};",
    )


text = upsert_key(text, "INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad", f'"{ipad_value}"')
text = upsert_key(text, "INFOPLIST_KEY_UIRequiresFullScreen", "YES")
path.write_text(text)
PY
fi

echo "OK: iPad auf Querformat (Vollbild) gesetzt."
