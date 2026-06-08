# iOS Aktuell - dice.budget

**Stand:** 2026-06-08  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `de0f8f2`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Dieses Dokument enthaelt ausschliesslich den aktuell relevanten iOS-/TestFlight-/App-Store-Stand. Aeltere iOS-Historie steht in `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect ist bei **Version 2.0**.
- Aktueller TestFlight-Build ist **2.0 (21)**.
- Naechster Upload ist **2.0 (22)**.
- M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-/Legal-Finalisierung + 3D-Startscreen-Icons + Spiel-UX Juni 2026 + Spielanalyse (Basis) sind in TestFlight `2.0 (21)`.
- **Alles seit `2.0 (21)`** (Alle-Fünfe-UX, Gaming-Feedback II, Punkte-Duell, Teilen vereinfacht, Coaching, Branding) ist **noch nicht** in TestFlight — geplant fuer Upload `2.0 (22)`.
- Web/API sind live unter https://dicebudget.bottle-trade.de.

## Was In 2.0 (22) Enthalten Sein Muss

- Alle-Fünfe-Markierung als Mini-Würfel; Zusatz-Alle-Fünfe mit Würfelwahl (+100); Portal-Popover.
- UI-Branding: Nutzer-sichtbar **Alle Fünfe** statt „Yatzy“.
- **Teilen:** nur Spielende + Startscreen-Bilanz; ein Teilen-Button → System-Share (PNG).
- Spiel-Feedback II: Gaming-Overlays + Layered Web-Audio (Bonus, Ergebnis 2/unten voll, Große Straße, Alle Fünfe); **kein** Share in Overlays.
- Spielanalyse: Coaching + **Punkte-Duell-Graphik** (Multi; Backend-Deploy `scoreProgression`).
- Einstellungen-Rücknavigation von Solo/Multi.
- Backend: Migration `extra_yatzy_die_values`, Coaching-API, `scoreProgression` (falls noch nicht deployed).

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

In Xcode: Team pruefen, Build-Nummer auf **22** erhoehen, **Any iOS Device** → **Product → Archive** → Upload.

## TestFlight-Checkliste 2.0 (22)

- Startscreen: Bilanz-Teilen-Button, Nav-Karten voll sichtbar (Multiplayer, Statistik, Einzelspiel, Einstellungen).
- Spielende: Teilen-Button mit System-Share.
- Erfolgs-Overlays: **kein** Share; Gaming-Animation + Sound.
- Spielanalyse: Punkte-Duell-Graph (Multi, nach Backend-Deploy).
- Alle-Fünfe-Miniwürfel, Zusatz-Würfelwahl, Branding „Alle Fünfe“.
- Regression: Footer auf Setup/Legal/Stats; `/play` footerfrei; Multi-Abschluss, Pool-Endspiel.

## App Store Connect (offen)

- Paid Applications Agreement, Bank/Steuer.
- Preis **1,19 EUR**.
- Screenshots, Beschreibung DE, Datenschutzfragebogen.
