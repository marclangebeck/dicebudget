# iOS Aktuell - dice.budget

**Stand:** 2026-06-10  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `66e8487`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Dieses Dokument enthaelt ausschliesslich den aktuell relevanten iOS-/TestFlight-/App-Store-Stand. Aeltere iOS-Historie steht in `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- **TestFlight `2.0 (27)` (aktuell):** enthält Produktcode **`66e8487`** (Arena ohne Mittel-Logo, Footer Glas-Morph, Card-Dashboards, Code nur teilen, …).
- Historisch: **`2.0 (26)`** wirkungslos (Build-Nummer erhöht, aber ohne `git pull`/`build:ios` — UI noch `f29cf7d`).
- **`2.0 (25)`:** letzter älterer verifizierter Stand vor Arena-Redesign.
- Web/API live: https://dicebudget.bottle-trade.de (nur Web; iOS-UI kommt aus lokalem Bundle).

## iOS-Bundle (kritisch)

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| `git pull` | Nein (nur Quellcode) |
| `npm run build` auf Server | Nein (nur Web unter `frontend/out/`) |
| **`npm run build:ios` auf Mac** | **Ja** (`cap sync` → `ios/App/App/public/`) |
| Xcode Archive ohne `build:ios` | Nein |

`frontend/ios/App/App/public/` ist in `.gitignore` — wird **nicht** mit `git pull` aktualisiert.

## Mac-Referenz-Workflow (künftiger Build)

```bash
cd /Users/marclangebeck/projects/kniffel
git restore frontend/package-lock.json
git pull origin milestone-22-prep
git log -1 --oneline
```

Erwartung: `66e8487 Footer-Menü: dezenterer Trigger und stärkerer Glas-Look`

```bash
cd /Users/marclangebeck/projects/kniffel/frontend
npm ci
npm run build:ios
brew unlink rsync
```

Prüfung vor Xcode:

```bash
grep -c home-arena-pane ios/App/App/public/_next/static/css/*.css
ls -lt ios/App/App/public/_next/static/css/ | head -3
```

`grep` muss mindestens eine Datei mit Zähler **≥ 1** liefern; CSS-Datum sollte aktuell sein.

Xcode öffnen:

```bash
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

In Xcode:

1. **Product → Clean Build Folder** (⇧⌘K)
2. Build-Nummer erhöhen (aktuell in TestFlight: **27**)
3. **Any iOS Device** → **Product → Archive** → Upload
4. Auf dem iPhone neuesten TestFlight-Build installieren

## Inhalt Von TestFlight 2.0 (27)

- **Startscreen:** Zwei Arena-Kacheln Multi/Solo, **kein** Mittel-Logo; zentrierte Überschriften/Taglines/Badges; dominante 3D-Würfel-Icons.
- **Footer:** `Home · Statistik · Einstellungen · Menü`; Hamburger dezent; Menü-Overlay mit Glas-Morph; Screenshot teilen.
- DiceBudget-Branding + Intro-Logo; Intro-Key v2.
- Multi: **Code teilen** nur Code.
- Erfolgs-Animationen Vollbild; Abschluss/Analyse Card-Dashboards.
- Zettel: Ergebnis 1/2/Spiel-Farben; Fortschritt 25/50/75 %; granulares Spiel-Feedback.
- Backend (API, nicht iOS-Bundle): Coaching, `scoreProgression`, Migration `extra_yatzy_die_values` — Deploy-Status prüfen.

## TestFlight-Checkliste (Build 27)

- Startscreen: Multi/Solo-Kacheln, große Würfel-Icons, kein Logo in der Mitte.
- Footer-Menü: dezenter Trigger, Glas-Panel, Screenshot/Support/Legal.
- Multi: Raum anlegen → **Code teilen** (nur Code).
- Fortschritt 25/50/75 %; nach Erfolgs-Overlays nacheinander.
- `/settings/feedback`: Toggles einzeln.
- Regression: Footer auf Setup/Legal/Stats; `/play` footerfrei; Pool-Endspiel; Teilen Spielende/Bilanz.

## Bekannte Mac-Fallen

- **`git pull` blockiert** durch `frontend/package-lock.json` → `git restore frontend/package-lock.json` vor Pull.
- **Xcode öffnet sich nicht** nach Build → explizit `open ios/App/App.xcworkspace` (siehe Workflow oben).
- **Build-Nummer erhöht, UI unverändert** → `npm run build:ios` fehlte oder Pull nicht auf `66e8487`.

## App Store Connect (offen)

- Paid Applications Agreement, Bank/Steuer.
- Preis **1,19 EUR**.
- Screenshots, Beschreibung DE, Datenschutzfragebogen.
