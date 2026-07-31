# iOS Aktuell - dice.budget

**Stand:** 2026-07-31  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD (Web):** `f5a2665`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- **TestFlight `2.0 (28)` (aktuell in Connect):** Produktcode **`d8b5952`** — Cinematic Editorial Startscreen.
- **Nächster geplanter Upload: `2.0 (29)`** — HEAD `f5a2665`: UX-Politur II + Auto-Hausregeln (2×/3× Alle Fünfe, Oberer Bereich), Info-„i“, Fortschritts-Delta nur Feldpunkte, Statistik Paarungen lokal löschen / „Das bin ich“, Feldeintrag-Performance.
- Web/API live: https://dicebudget.bottle-trade.de (nach Server-Build auf aktuellem HEAD; Backend-Deploy ggf. separat)

## iOS-Bundle (kritisch)

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| `git pull` | Nein (nur Quellcode) |
| `npm run build` auf Server | Nein (nur Web unter `frontend/out/`) |
| **`npm run build:ios` auf Mac** | **Ja** (`cap sync` → `ios/App/App/public/`) |
| Xcode Archive ohne `build:ios` | Nein |

`frontend/ios/App/App/public/` ist in `.gitignore`.

## Mac-Workflow (TestFlight / App Store Connect)

```bash
cd ~/projects/kniffel
git restore frontend/package-lock.json
git pull origin milestone-22-prep
git log -1 --oneline
```

Erwartet: `f5a2665` (oder neuerer Commit auf dem Branch).

```bash
cd ~/projects/kniffel/frontend
```

`NEXT_PUBLIC_LABS_PIN`, ggf. `NEXT_PUBLIC_ADMIN_API_KEY` und für das Menü **`NEXT_PUBLIC_APP_BUILD=<Xcode-Build>`** (z. B. `29`) in `.env.production` setzen:

```bash
grep -E 'NEXT_PUBLIC_LABS_PIN|NEXT_PUBLIC_ADMIN_API_KEY|NEXT_PUBLIC_APP_VERSION|NEXT_PUBLIC_APP_BUILD' .env.production
```

```bash
npm install
npm run build:ios
brew unlink rsync
```

`build:ios` öffnet danach automatisch Xcode (`npm run open:ios`).

Optional Bundle-Check:

```bash
grep -c home-cinematic-door ios/App/App/public/_next/static/css/*.css
ls -lt ios/App/App/public/_next/static/css/ | head -3
```

Xcode öffnen:

```bash
npm run open:ios
```

(`build:ios` ruft das am Ende automatisch auf.)

Manuell mit vollem Befehl:

```bash
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

### In Xcode (Archive → App Store Connect)

1. **Product → Clean Build Folder** (⇧⌘K)
2. Target **App** → **General** → **Build** erhöhen: **29** (aktuell in TestFlight: **28**)
3. Scheme **App**, Ziel **Any iOS Device (arm64)**
4. **Product → Archive**
5. Organizer → **Distribute App** → **App Store Connect** → **Upload**
6. In App Store Connect: Build unter **TestFlight** warten (Verarbeitung), dann auf Gerät testen

Ausführliche Connect-Schritte: `docs/testflight-app-store.md`, Einsteiger: `docs/ios-xcode-anleitung.md`.

## TestFlight-Checkliste (Build 29+, HEAD `f5a2665`)

- **Einstellungen:** Ein-Screen, Solo/Multi-Start, Hausregeln nach Code, iPad-Namen leer tippbar
- **Hausregeln:** Brennt; Verkauf; 2×/3× Alle Fünfe (auto im Duell); Oberer Bereich zuerst; Info-„i“ pro Regel + Visuelle Einblendungen
- **Fortschritt 25/50/75 %:** vorn/zurück mit Punktdifferenz nur Feldpunkte (ohne oberen Bonus)
- **Statistik:** Hero/Badges; „Das bin ich“; Paarungen lokal löschen/wiederherstellen; Baseline ohne Admin-Key
- **Spielanalyse:** Kern „Warum verloren?“; Graph alle 10 %; Details eingeklappt
- **Screenshot:** Footer „Bild“, Blitz, Vorschau, Toast
- **Startscreen / UX:** Cinematic, Hamburger-Sheet, Accordion Einstellungen/Statistik, Abschluss-Buttons
- Entwickler-Vorschau: Code pro Gerät auf `/settings`
- Multi Code teilen, Pool-Endspiel, Alle Fünfe Eintrag; Feldeintrag spürbar schneller

## Typische Fehler

- **UI alt trotz Pull** → `npm run build:ios` fehlte vor Archive
- **Labor-Code ungültig** → `NEXT_PUBLIC_LABS_PIN` fehlt in `.env.production` oder Build nach PIN-Änderung nicht wiederholt
- **Build-Nummer nicht erhöht** → Upload wird von Connect abgelehnt oder ersetzt nichts Sichtbares
