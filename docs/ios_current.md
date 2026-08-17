# iOS Aktuell - dice.budget

**Stand:** 2026-08-15  
**Branch:** `milestone-22-prep`  
**HEAD:** `faf721b`  
**Bundle ID:** `de.bottletrade.dicebudget`  
**Apple Team ID (AASA):** `5QGGV8N5ZD`

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- TestFlight: frischer Archive-Build **2026-08-15** (Multi-QR / In-App-Scan / Host-Overlay vereinfacht); Deployment Target **15.0**.
- **Web/iOS ein Build (M43):** Admin per `NEXT_PUBLIC_ADMIN_PIN`; API-Key lokal.
- Labs (`NEXT_PUBLIC_LABS_PIN`) getrennt von Admin.
- **Events:** drei Apps — `docs/tournament/products.md`. Dieses Dokument und `frontend` `npm run build:ios` betreffen nur **DiceBudget Pro**. Tournament: `apps/tournament`. GO: geplant. DiceBudget-Kern bleibt unantastbar.
- **Spielername:** einmal nach Sanduhr; ohne Backend-Deploy in Prod sieht die App den Namen-API-Fehler. iOS-Build nach Pull.

## Deployment Target

- Mindest-iOS: **15.0** (`Podfile`, Xcode `IPHONEOS_DEPLOYMENT_TARGET`)
- Behebt die wiederkehrenden Xcode-Hinweise zu veraltetem iOS-14-Target
- Nicht in `capacitor.config.ts` als `minVersion` setzen (Capacitor 7 kennt die Property nicht)

## Universal Links / Multi-QR

- Host nach Raum anlegen: nur **„Spiel beitreten“** + QR + **„Zur Lobby (auch als Host)“**
- QR-Inhalt: `https://dicebudget.bottle-trade.de/multi/join?code=…`
- Gäste: Startscreen **QR-Code scannen** (In-App-Kamera) oder System-Kamera → Universal Link
- `NSCameraUsageDescription` in `Info.plist`
- Keine manuelle Code-Eingabe mehr
- AASA: `/.well-known/apple-app-site-association` und `/apple-app-site-association`
- iOS Entitlement: `applinks:dicebudget.bottle-trade.de` (`App.entitlements`)
- App: `DeepLinkRouter` → Join-Pfad; ohne App: Website-Join
- Nach Nginx-/AASA-Änderung: Reload; Apple kann AASA kurz cachen

### Mac `.env.production` (kritisch)

| Variable | Zweck |
|----------|--------|
| `NEXT_PUBLIC_LABS_PIN` | InApp-Käufe (Features) freischalten |
| `NEXT_PUBLIC_ADMIN_PIN` | Admin-Oberfläche freischalten (alphanumerisch; Key danach lokal) |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Optional/Legacy — lieber leer; Key lokal unter Einstellungen → Admin |
| `NEXT_PUBLIC_APP_VERSION` | z. B. `2.0` (Web-Fallback; iOS-Menü liest native Version) |
| `NEXT_PUBLIC_APP_BUILD` | Web: typisch `web`. iOS-Menü zeigt **Xcode Build** zur Laufzeit (`App.getInfo`) |
| `NEXT_PUBLIC_SITE_URL` | empfohlen `https://dicebudget.bottle-trade.de` |

Server-`frontend/.env.production`: Admin-API-Key **leer**, Admin-PIN gesetzt. Backend `ADMIN_API_KEY` unverändert.

## iOS-Bundle (kritisch)

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| `git pull` | Nein (nur Quellcode) |
| `npm run build` auf Server | Nein (nur Web unter `frontend/out/`) |
| **`npm run build:ios` auf Mac** | **Ja** (`cap sync` → `ios/App/App/public/`) |
| Xcode Archive ohne `build:ios` | Nein |

`frontend/ios/App/App/public/` ist in `.gitignore`. Befehle nur auf dem **Mac**, nicht auf dem Linux-Server.

## Mac-Workflow (TestFlight / App Store Connect)

Bei lokalen Xcode-/Pod-Änderungen vor Pull oft:

```bash
cd ~/projects/kniffel
git restore frontend/ios/App/App.xcodeproj/project.pbxproj frontend/ios/App/Podfile frontend/package-lock.json
git pull origin milestone-22-prep
```

Oder hart auf Remote setzen:

```bash
cd ~/projects/kniffel
git fetch origin
git reset --hard origin/milestone-22-prep
git log -1 --oneline
```

```bash
cd ~/projects/kniffel/frontend
grep -E 'NEXT_PUBLIC_LABS_PIN|NEXT_PUBLIC_ADMIN_PIN|NEXT_PUBLIC_ADMIN_API_KEY|NEXT_PUBLIC_APP_VERSION|NEXT_PUBLIC_APP_BUILD' .env.production
npm install
npm run build:ios
brew unlink rsync
```

`build:ios` öffnet Xcode. `brew unlink rsync` nur bei Upload-Problemen mit Homebrew-rsync.

### In Xcode (Archive → App Store Connect)

1. **Product → Clean Build Folder** (⇧⌘K)
2. Target **App** → **General** → **Build** erhöhen (Menü zeigt diese Nummer automatisch nach `build:ios`)
3. Scheme **App**, Ziel **Any iOS Device (arm64)** — nicht Simulator
4. **Product → Archive**
5. Organizer → **Distribute App** → **App Store Connect** → **Upload**
6. TestFlight: Verarbeitung abwarten; Gruppe **Freunde** zuweisen falls nötig

Ausführlich: `docs/testflight-app-store.md`, Einsteiger: `docs/ios-xcode-anleitung.md`. **M30 Store-Submit:** Phase 7 in `docs/testflight-app-store.md`.

## TestFlight-Checkliste (aktueller HEAD+)

- **Menü:** Version 2.0 (Build-Nr. = Xcode); aktiver Footer-Tab sichtbar
- **Startscreen:** Mitte zwei Buttons nebeneinander — Multi-Raum-QR (aktiv) und Turnier-QR (Demnächst); Kamera-Permission für Multi
- **Host:** Raum anlegen → nur Titel + QR + Zur Lobby
- **Gast:** Scan öffnet Join/Lobby; Universal Link aus System-Kamera optional
- **Spielregeln / Labs / Admin** wie bisher (Labs vs. Admin-PIN)
- Fortschritt, Multi, Solo, Statistik / Paarungen

## Bekannte Hinweise

- Web-Menü zeigt `Version 2.0 (web)` — Absicht.
- `jsqr` nach Pull: `npm install` nötig, sonst Build „Can't resolve 'jsqr'“.
- Mehrere Lockfiles-Warnung (`~/package-lock.json`) auf dem Mac: störend, aber unkritisch.
