# iOS Aktuell - dice.budget

**Stand:** 2026-06-01  
**Branch:** `milestone-22-prep`  
**Git-HEAD:** `549e8a7`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Dieses Dokument enthaelt ausschliesslich den aktuell relevanten iOS-/TestFlight-/App-Store-Stand. Aeltere iOS-Historie steht in `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect ist bei **Version 2.0**.
- Aktueller TestFlight-Build ist **2.0 (6)**.
- Naechster Upload ist **2.0 (7)**.
- M34 + M35 + UI-Politur sind **noch nicht** in TestFlight `2.0 (6)`.
- Der Upload `2.0 (7)` muss M34 + M35 + UI-Politur enthalten.
- Web/API sind live unter https://dicebudget.bottle-trade.de.

## Was In 2.0 (7) Enthalten Sein Muss

- M34 Bugfixes + Stats-Reset:
  - Bonus-Konfetti
  - Support-Link
  - Gegner-Pool-Refresh ohne Polling
  - Pool-Endspiel-Fix
  - Stats-Alias-Merge
  - serverseitiges Stats-Zuruecksetzen
  - Capacitor-Fix fuer Paarungs-Detail
- M35 Paarungen bearbeiten:
  - Siege je Spieler editierbar
  - Netto-Punktedifferenz editierbar
  - `POST /stats/pairings/baseline`
- UI-Politur:
  - Punktwahl gelb gefuellt
  - Spielzettel fuellt volle Bildschirmhoehe

## Mac-Workflow Fuer Naechsten Upload

Auf dem Mac:

```bash
cd /Users/marclangebeck/projects/kniffel
git pull origin milestone-22-prep
cd frontend
npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Falls `git pull` wegen Xcode-Projektdatei blockiert:

```bash
cd /Users/marclangebeck/projects/kniffel
git restore frontend/ios/App/App.xcodeproj/project.pbxproj
git pull origin milestone-22-prep
```

In Xcode:

1. `App.xcworkspace` verwenden, nicht `.xcodeproj`.
2. Signing-Team pruefen.
3. Version `2.0` lassen.
4. Build auf `7` setzen.
5. Ziel `Any iOS Device`.
6. `Product -> Archive`.
7. Upload zu App Store Connect.

## App Store Connect Offen

- Paid Applications Agreement abschliessen.
- Bankdaten hinterlegen.
- Steuerdaten hinterlegen.
- Preis auf `1,19 EUR` setzen.
- Screenshots hochladen.
- Beschreibung auf Deutsch eintragen.
- Datenschutzfragebogen ausfuellen.
- Datenschutz-URL: https://dicebudget.bottle-trade.de/datenschutz
- Support-URL: https://dicebudget.bottle-trade.de

## Stolpersteine

- Web-Deploy aktualisiert nicht die iOS-App.
- `frontend/ios/App/App/public/` ist gitignored; `npm run build:ios` auf dem Mac ist Pflicht.
- `DEVELOPMENT_TEAM` wird nicht im Git gepflegt; nach Pull in Xcode pruefen.
- Bei `Copy failed` / `rsync error`: `brew unlink rsync` und Xcode mit System-PATH starten.
- Alten App-Store-Connect-Eintrag `com.mlangebeck.mobileapp` ignorieren.
- App muss `de.bottletrade.dicebudget` verwenden.

## Relevante Dokus

- `docs/ios_archive.md` fuer alte Build-/TestFlight-Historie.
- `docs/testflight-app-store.md` fuer Schritt-fuer-Schritt-App-Store-Connect.
- `docs/ios-xcode-anleitung.md` fuer Xcode-Einsteiger-Anleitung.
