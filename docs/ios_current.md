# iOS Aktuell - dice.budget

**Stand:** 2026-06-11  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `d8b5952`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- **TestFlight `2.0 (28)` (aktuell):** Produktcode **`d8b5952`** — Cinematic Editorial Startscreen (gestapelte Poster Multi/Solo, Bilanz-Chip, integrierte CTA).
- Zuvor: **`2.0 (27)`** mit `66e8487` (Arena Classic); **`2.0 (26)`** historisch wirkungslos.
- Web/API live: https://dicebudget.bottle-trade.de (nur Web; iOS-UI aus lokalem Bundle).

## iOS-Bundle (kritisch)

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| `git pull` | Nein (nur Quellcode) |
| `npm run build` auf Server | Nein (nur Web unter `frontend/out/`) |
| **`npm run build:ios` auf Mac** | **Ja** (`cap sync` → `ios/App/App/public/`) |
| Xcode Archive ohne `build:ios` | Nein |

`frontend/ios/App/App/public/` ist in `.gitignore`.

## Mac-Referenz-Workflow

```bash
cd /Users/marclangebeck/projects/kniffel
git restore frontend/package-lock.json
git pull origin milestone-22-prep
git log -1 --oneline
```

Erwartung: `d8b5952 Startscreen: Cinematic Editorial mit integriertem CTA und Classic-Rollback.`

```bash
cd /Users/marclangebeck/projects/kniffel/frontend
npm ci
npm run build:ios
brew unlink rsync
```

Prüfung vor Xcode:

```bash
grep -c home-cinematic-door ios/App/App/public/_next/static/css/*.css
ls -lt ios/App/App/public/_next/static/css/ | head -3
```

`grep` muss **> 0** liefern.

Xcode öffnen:

```bash
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

In Xcode:

1. **Product → Clean Build Folder** (⇧⌘K)
2. Build-Nummer erhöhen (aktuell in TestFlight: **28**)
3. **Any iOS Device** → **Product → Archive** → Upload
4. Neuesten TestFlight-Build auf dem Gerät installieren

## Inhalt Von TestFlight 2.0 (28)

- **Startscreen:** Cinematic Editorial — gestapelte Poster Multi/Solo; Bilanz-Chip; Würfel-Bühne; integrierte Glas-CTA.
- **Footer:** `Home · Statistik · Einstellungen · Menü`; Glas-Morph-Menü; Screenshot teilen.
- DiceBudget-Branding; Multi Code nur teilen; Erfolgs-Animationen Vollbild; Card-Dashboards Abschluss/Analyse.
- Classic-Startscreen weiter per Layout-Switch verfügbar (nur Web-Build-Env, nicht iOS-spezifisch).

## TestFlight-Checkliste (Build 28)

- Startscreen: gestapelte Multi/Solo-Poster, Bilanz-Chip, CTA getrennt von Würfeln.
- Footer-Menü: Glas-Panel, Screenshot/Support/Legal.
- Multi: Raum anlegen → **Code teilen** (nur Code).
- Fortschritt 25/50/75 %; nach Erfolgs-Overlays nacheinander.
- Regression: `/play`, Pool-Endspiel, Teilen Spielende/Bilanz.

## Bekannte Mac-Fallen

- **`git pull` blockiert** durch `frontend/package-lock.json` → `git restore frontend/package-lock.json` vor Pull.
- **Build-Nummer erhöht, UI unverändert** → `npm run build:ios` fehlte oder Pull nicht auf aktuellem HEAD.
- **Classic statt Cinematic in Web** → `NEXT_PUBLIC_HOME_LAYOUT` in `.env.production` prüfen (Server, gitignored).

## App Store Connect (offen)

- Paid Applications Agreement, Bank/Steuer.
- Preis **1,19 EUR**.
- Screenshots, Beschreibung DE, Datenschutzfragebogen.
