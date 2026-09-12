# iOS Aktuell - DiceBudget Strategy Edition

**Stand:** 2026-09-12  
**Branch:** `milestone-22-prep`  
**Release-Stand iOS:** Version **2.0**, TestFlight zuletzt **Build 98**; nächster Upload **99**  
**Bundle ID:** `de.bottletrade.dicebudget`  
**Apple Team ID (AASA):** `5QGGV8N5ZD`

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Produkt (Release 2.0)

- **DiceBudget Strategy Edition** — einmaliger App-Kauf; **keine Werbung**; **keine Kern-In-App-Käufe**.
- **Strategy-Regeln** (Pool, Hausregeln unter Einstellungen → Multi) sind **Bestandteil der gekauften App**, nicht separat per IAP freizuschalten.
- **Kein Login** / kein Account in der App.
- **Solo** weitgehend lokal auf dem Gerät.
- **Multiplayer + Statistiken/Paarungen** über den eigenen Server (`https://dicebudget.bottle-trade.de/api`).
- **Multi-Einstieg:** QR oder Link primär; **Raumcode** als zusätzlicher Fallback („Code eingeben“).
- Datenschutz: https://dicebudget.bottle-trade.de/datenschutz

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- Nächster Upload: **Build 97** (Vorgänger in ASC laut Abnahme: **2.0 / 96**).
- Deployment Target: **15.0**.
- **Web/iOS ein Build (M43):** Admin per `NEXT_PUBLIC_ADMIN_PIN`; API-Key lokal unter Einstellungen → Admin (Bundle ohne eingebetteten Admin-API-Key).
- Optionale Hausregeln: Toggles unter **Einstellungen → Multi** (bei Strategy), **ohne Labs-PIN**.
- `NEXT_PUBLIC_LABS_PIN` / `labsAccess` ggf. noch im Repo (Legacy); **kein Gate** mehr für Hausregeln in der UI.
- **Events:** drei Apps — `docs/tournament/products.md`. `frontend` `npm run build:ios` = nur **DiceBudget Pro**. Tournament: `apps/tournament`. GO: geplant.

## Deployment Target

- Mindest-iOS: **15.0** (`Podfile`, Xcode `IPHONEOS_DEPLOYMENT_TARGET`)
- Nicht in `capacitor.config.ts` als `minVersion` setzen (Capacitor 7 kennt die Property nicht)

## Universal Links / Multi-Beitritt

- Host nach Raum anlegen: QR mit Join-URL + Lobby
- QR-/Link-Inhalt: `https://dicebudget.bottle-trade.de/multi/join?code=…`
- Gäste: In-App-QR primär; System-Kamera → Universal Link; **Raumcode-Eingabe** als Fallback
- `NSCameraUsageDescription` in `Info.plist`
- AASA: `/.well-known/apple-app-site-association` und `/apple-app-site-association`
- iOS Entitlement: `applinks:dicebudget.bottle-trade.de` (`App.entitlements`)
- App: `DeepLinkRouter` → Join-Pfad

### Mac `.env.production` (kritisch vor `build:ios`)

| Variable | Zweck |
|----------|--------|
| `NEXT_PUBLIC_ADMIN_PIN` | Admin-Oberfläche freischalten (alphanumerisch) |
| `NEXT_PUBLIC_ADMIN_API_KEY` | **leer** lassen — Key nur lokal in der App hinterlegen |
| `NEXT_PUBLIC_APP_VERSION` | `2.0` (Web-Fallback; iOS-Menü liest native Version) |
| `NEXT_PUBLIC_APP_BUILD` | Web: `web`. iOS-Menü zeigt **Xcode Build** zur Laufzeit |
| `NEXT_PUBLIC_SITE_URL` | `https://dicebudget.bottle-trade.de` |
| `NEXT_PUBLIC_LABS_PIN` | Legacy/optional — **nicht** mehr für Hausregeln nötig |

Server-`frontend/.env.production`: Admin-API-Key im Bundle idealerweise leer; Backend `ADMIN_API_KEY` unverändert (nicht in Git).

## iOS-Bundle (kritisch)

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| `git pull` | Nein (nur Quellcode) |
| `npm run build` auf Server | Nein (nur Web unter `frontend/out/`) |
| **`npm run build:ios` auf Mac** | **Ja** (`cap sync` → `ios/App/App/public/`) |
| Xcode Archive ohne `build:ios` | Nein |

`frontend/ios/App/App/public/` ist in `.gitignore`. Befehle nur auf dem **Mac**.

Repo-Xcode-Stand für Release: **Marketing 2.0**, **CURRENT_PROJECT_VERSION 97** in `project.pbxproj`.

## Mac-Workflow (TestFlight / App Store Connect) — Build 97

```bash
cd ~/projects/kniffel
git fetch origin
git checkout milestone-22-prep
git pull origin milestone-22-prep
git log -1 --oneline
```

Bei lokalen Xcode-/Pod-Konflikten vor dem Pull ggf.:

```bash
git restore frontend/ios/App/App.xcodeproj/project.pbxproj frontend/ios/App/Podfile frontend/package-lock.json
```

```bash
cd ~/projects/kniffel/frontend
grep -E 'NEXT_PUBLIC_ADMIN_PIN|NEXT_PUBLIC_ADMIN_API_KEY|NEXT_PUBLIC_APP_VERSION|NEXT_PUBLIC_APP_BUILD|NEXT_PUBLIC_SITE_URL' .env.production
# Erwartung: VERSION=2.0, ADMIN_API_KEY leer, SITE_URL Produktion
npm install
npm run build:ios
```

`build:ios` öffnet Xcode. Bei Upload-Problemen mit Homebrew-rsync: `brew unlink rsync`.

### In Xcode (Archive → App Store Connect)

1. **Product → Clean Build Folder** (⇧⌘K)
2. Target **App** → **General**: Marketing **2.0**, Build **97**
3. Scheme **App**, Konfiguration **Release**, Ziel **Any iOS Device (arm64)**
4. Signing: Automatic, Team korrekt; Bundle `de.bottletrade.dicebudget`
5. **Product → Archive** → Organizer → **Distribute App** → **App Store Connect** → **Upload**
6. **Nicht** „Submit for Review“ / keine Veröffentlichung — nur TestFlight
7. TestFlight: Verarbeitung abwarten; Gruppe zuweisen falls nötig

Ausführlich: `docs/testflight-app-store.md`, Einsteiger: `docs/ios-xcode-anleitung.md`.

## TestFlight-Checkliste (2.0 / 97)

- Menü: `Version 2.0 (97)`
- Start: Multi-QR / Turnier-Eintritt; Kamera-Permission
- Multi: QR/Link; Raumcode-Fallback
- Einstellungen → Multi: Hausregeln ohne Code/Sperre (Strategy)
- Solo lokal; Multi/Stats über Prod-API
- Admin nur nach PIN; kein Login; keine Werbung

## Bekannte Hinweise

- Web-Menü zeigt `Version 2.0 (web)` — Absicht.
- Agent hat **keinen Mac-Zugriff**; Archive/Upload nur auf dem Mac.
- Backend muss die aktuelle Dist laufen (Effizienz-Scores u. a.); nach Deploy: `sudo systemctl restart kniffel-backend.service`.
