# iOS Aktuell - dice.budget

**Stand:** 2026-06-15  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `d6bd92b` (Mac nach `git pull`)  
**Bundle ID:** `de.bottletrade.dicebudget`  

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- **TestFlight `2.0 (28)` (aktuell in Connect):** Produktcode **`d8b5952`** — Cinematic Editorial Startscreen.
- **Nächster geplanter Upload: `2.0 (29)`** — HEAD `d6bd92b`: Feature-Labor, Zusatzregeln-UI, iPad-Tisch, Strategy-Fixes.
- Web/API live: https://dicebudget.bottle-trade.de

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

```bash
cd ~/projects/kniffel/frontend
```

`NEXT_PUBLIC_LABS_PIN` in `.env.production` setzen (Entwickler-Vorschau in der App):

```bash
grep NEXT_PUBLIC_LABS_PIN .env.production
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

## TestFlight-Checkliste (Build 29+, HEAD `d6bd92b`)

- Entwickler-Vorschau: Code auf **jedem Testgerät** → `/settings/labs` → Toggles
- **Brennt** im Wurf-Overlay; **Zusatzregeln** rechts am Zettel / eingeklappt im Overlay (Verkauf, 2× Alle Fünfe)
- iPad-Tischmodus: Zusatzregeln + Brennt wie Online-Multi
- Cinematic Startscreen, Footer/Menü, Multi Code teilen, Pool-Endspiel
- Alle Fünfe Eintrag Wurf 23+; Match-Analyse

## Typische Fehler

- **UI alt trotz Pull** → `npm run build:ios` fehlte vor Archive
- **Labor-Code ungültig** → `NEXT_PUBLIC_LABS_PIN` fehlt in `.env.production` oder Build nach PIN-Änderung nicht wiederholt
- **Build-Nummer nicht erhöht** → Upload wird von Connect abgelehnt oder ersetzt nichts Sichtbares
