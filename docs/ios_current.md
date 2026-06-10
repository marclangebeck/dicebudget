# iOS Aktuell - dice.budget

**Stand:** 2026-06-10  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** Commit-Batch 2026-06-10 auf `milestone-22-prep`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Dieses Dokument enthaelt ausschliesslich den aktuell relevanten iOS-/TestFlight-/App-Store-Stand. Aeltere iOS-Historie steht in `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect ist bei **Version 2.0**.
- Aktueller TestFlight-Build ist **`2.0 (25)`**.
- Naechster Upload ist **`2.0 (26)`** (Stand ab `f29cf7d` / `b17b9f5` + Arena-Commit).
- Produktcode ab `f29cf7d` enthaelt zusaetzlich: **Code teilen nur Code**, **Vollbild-Erfolgs-Animationen**, **DiceBudget-Branding/Intro**, **Card-Dashboards** (Abschluss/Analyse), **Footer-Menü mit Screenshot**, **Startscreen-Arena** (Multi vs. Solo).
- Produktcode `66e715a` … `b17b9f5`: Zettel-Ergebnis-Farben, Fortschritt 25/50/75 %, granulares Spiel-Feedback, Fortschritt-Warteschlange.
- Web/API sind live unter https://dicebudget.bottle-trade.de.

## Was In 2.0 (26) Enthalten Sein Soll (falls noch nicht in 25)

- Startscreen-Arena: zwei Vollbild-Kacheln Multi vs. Solo, VS-Badge, Aurora/Glow.
- Footer: `Home · Statistik · Einstellungen · Menü` mit Screenshot teilen.
- DiceBudget-Branding + Intro-Logo; Intro-Key v2.
- Multi: **Code teilen** nur Code (kein Einladungstext).
- Erfolgs-Animationen Vollbild; Abschluss/Analyse als Card-Dashboards.
- Zettel: Ergebnis 1/2/Spiel in Feld-Spalte mit gleichen Farben wie Wertespalten.
- Fortschritt 25/50/75 %: Overlay + Sound; nacheinander nach Erfolgs-Overlays.
- Spiel-Feedback granular: `/settings/feedback` (Animationen, Sounds, Fortschritt).
- Backend (falls noch offen): Coaching-API, `scoreProgression`, Migration `extra_yatzy_die_values`.

## Bereits In TestFlight (bis 2.0 (25))

- M34 Bugfixes + Stats-Reset
- M35 Paarungen bearbeiten
- UI-Politur, iPad-Tischmodus, Game-Dashboard, Footer-Tabbar, footerfreie `/play`
- Spiel-UX Juni 2026 (Werten/Nicht werten, Alle-Fünfe-Würfel-Abfrage)
- Spielanalyse (optional nach Spielende)
- Alle-Fünfe-Miniwürfel, Zusatz-Würfelwahl, Branding „Alle Fünfe“
- Gaming-Feedback II, Teilen (Spielende/Bilanz), Coaching, Punkte-Duell (nach Backend-Deploy)
- Einstellungen-Rücknavigation `?from=solo|multi`

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

In Xcode: Team pruefen, Build-Nummer auf **26** erhoehen, **Any iOS Device** → **Product → Archive** → Upload.

## TestFlight-Checkliste 2.0 (26)

- Zettel: Ergebnis 1/2/Spiel links mit korrekten Farben (grün/dunkel).
- Multi: Raum anlegen → **Code teilen** (nicht kopieren).
- Fortschritt: 25/50/75 %-Overlay; auch nach Alle-Fünfe-Animation nacheinander.
- Einstellungen → Spiel-Feedback → einzelne Toggles.
- Regression: Footer auf Setup/Legal/Stats; `/play` footerfrei; Pool-Endspiel; Teilen Spielende/Bilanz.

## App Store Connect (offen)

- Paid Applications Agreement, Bank/Steuer.
- Preis **1,19 EUR**.
- Screenshots, Beschreibung DE, Datenschutzfragebogen.
