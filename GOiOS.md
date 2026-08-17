# GOiOS - dice.budget

Diese Datei ist ein Kompatibilitaets-Index. Fuer aktuellen iOS-/TestFlight-/App-Store-Stand bitte `docs/ios_current.md` lesen.

## Aktuell

- Aktueller iOS-Stand: `docs/ios_current.md`
- Aeltere iOS-/TestFlight-Historie: `docs/ios_archive.md`
- Xcode-Einsteiger-Anleitung: `docs/ios-xcode-anleitung.md`
- App-Store-Connect-Schrittfolge: `docs/testflight-app-store.md`
- Turnier-Host (Events, eigene App): `docs/tournament/` · Produktfamilie: `docs/tournament/products.md`

## Kurzstand

- Bundle ID **DiceBudget** (Pro): `de.bottletrade.dicebudget`
- Version in App Store Connect: `2.0`
- Deployment Target: **15.0**
- TestFlight: Archive **2026-08-15** (HEAD `faf721b` — Multi-QR / Scan / Host-Overlay)
- Details und Checkliste: `docs/ios_current.md`
- Nächster großer Schritt DiceBudget: Abnahme QR-Build, danach **M30** Store-Submit (Nutzer-GO)
- **Drei Apps:** Pro + **Tournament** (Host, `apps/tournament`) + **GO** (geplant). Siehe `docs/tournament/products.md`. `npm run build:ios` in `frontend/` erzeugt **nicht** Tournament und **nicht** GO.

## Wichtig

- Web-Deploy und iOS-Release sind getrennt; `ios/App/App/public/` ist gitignored.
- Nach UI-Aenderungen: Mac pull (ggf. `git restore` pbxproj/Podfile/lock), `npm install`, `npm run build:ios`, Archive/Upload.
- **Menü-Version:** iOS = Xcode Build zur Laufzeit (`App.getInfo`); Web = `NEXT_PUBLIC_APP_*`.
- **Admin (M43):** `NEXT_PUBLIC_ADMIN_PIN` vor `build:ios`; `NEXT_PUBLIC_ADMIN_API_KEY` leer.
- **Multi-QR:** Associated Domains `applinks:dicebudget.bottle-trade.de`; Kamera-Permission für In-App-Scan.
- Der verbindliche Sync-Workflow steht in `AGENT_RULES.md` Sektion 9.
- Events dürfen die DiceBudget-Pro-App nicht beschädigen (harte Regel in `docs/tournament/products.md`).
