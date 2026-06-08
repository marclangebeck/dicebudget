# iOS Aktuell - dice.budget

**Stand:** 2026-06-08
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `80892e5`
**Bundle ID:** `de.bottletrade.dicebudget`  

Dieses Dokument enthaelt ausschliesslich den aktuell relevanten iOS-/TestFlight-/App-Store-Stand. Aeltere iOS-Historie steht in `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect ist bei **Version 2.0**.
- Aktueller TestFlight-Build ist **2.0 (21)**.
- Naechster Upload ist **2.0 (22)**.
- M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-/Legal-Finalisierung + 3D-Startscreen-Icons + Spiel-UX Juni 2026 + Spielanalyse sind in TestFlight `2.0 (21)`.
- **Alle-Fünfe-Miniwürfel / Zusatz-Alle-Fünfe-Würfelwahl** (`cb101f6`), **Spiel-Feedback Gaming-Politur** (`a93e462`), **Erfolg teilen** und **Alle-Fünfe-Branding** sind **noch nicht** in TestFlight `2.0 (21)` — geplant fuer Upload `2.0 (22)`.
- Web/API sind live unter https://dicebudget.bottle-trade.de.

## Was In 2.0 (22) Enthalten Sein Muss

- Alle-Fünfe-Markierung als Mini-Würfel (50 % Feldhöhe); Zusatz-Alle-Fünfe mit Würfelwahl (+100); Portal-Popover.
- UI-Branding: Nutzer-sichtbar **Alle Fünfe** statt „Yatzy“ (technische IDs unveraendert).
- Erfolg teilen: Canvas-Karte + WhatsApp/Instagram/System auf Overlays, Abschluss, Analyse, Bilanz, Tischmodus.
- Spiel-Feedback: Gaming-Overlays + Layered Web-Audio (Bonus, untere Spalte, Große Straße, Alle Fünfe).
- Spielanalyse-Coaching: Narrative, Stärken/Schwächen, Pool-Report, Tipps (Multi nach Backend-Deploy).
- Einstellungen-Rücknavigation von Solo/Multi.
- Backend: Migration `extra_yatzy_die_values` (falls noch nicht deployed), Coaching-API, Alle-Fünfe-Fehlertexte.

## Bereits In 2.0 (21)

- M34 Bugfixes + Stats-Reset
- M35 Paarungen bearbeiten
- UI-Politur (Punktwahl gelb, volle Zettelhöhe, Ergebnis-Zeilen)
- iPad-Tischmodus (2 Spieler auf einem iPad)
- Game-Dashboard-Design, Footer-Tabbar, footerfreie `/play`
- Spiel-UX Juni 2026 (Werten/Nicht werten, Alle-Fünfe-Würfel-Abfrage beim Eintrag, dunkle Ergebniszeilen)
- Spielanalyse (optional nach Spielende, Historie unter `/stats/pairing`)

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
4. Build auf `22` setzen.
5. Ziel `Any iOS Device`.
6. `Product -> Archive`.
7. Upload zu App Store Connect.

## TestFlight-Pruefung Fuer 2.0 (22)

- Alle-Fünfe-Miniwürfel neben Feld-Würfeln; Umbruch ab 6. Alle Fünfe gleicher Augenzahl.
- Zusatz-Alle-Fünfe (+): Würfelwahl sichtbar, Popover nicht abgeschnitten; UI-Text „Alle Fünfe“.
- Erfolg teilen auf Overlay, Abschluss, Analyse, Bilanz, Tischmodus-Duell.
- Spiel-Feedback: Gaming-Overlays + Sound bei Bonus, untere Spalte, Große Straße, Alle Fünfe.
- iPhone: bestehender Solo-/Multiplayer-Flow unveraendert.
- iPhone: Footer-Tabbar auf Start-, Setup-, Settings-, Statistik-, Legal-Screens; `/play` footerfrei.
- iPad Querformat: Tischmodus mit zwei anklickbaren Zetteln + Share/Spielanalyse.
- Spielanalyse nach Abschluss und unter `/stats/pairing`.

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
