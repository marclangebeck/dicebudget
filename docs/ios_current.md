# iOS Aktuell - DiceBudget Strategy Edition

**Stand:** 2026-09-12  
**Branch:** `milestone-22-prep`  
**Release-Stand iOS:** Version **2.0**, nächster Upload **Build 100** (nach TF 98/99 ohne UI-Update)  
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
- TestFlight: Builds **98/99** konnten die Hausregeln-UI verfehlen, wenn Xcode ein **veraltetes** `ios/App/App/public` gepackt hat.
- **Ursache Web ≠ TestFlight:** Die iOS-App lädt **kein** Live-Web. Sie packt die Dateien aus `frontend/ios/App/App/public` (Capacitor `webDir: out` → sync). Nginx-Web (`frontend/out`) und TestFlight sind entkoppelt.
- **Aktuell (ab Build 101):** Capacitor `server.url` = `https://dicebudget.bottle-trade.de/app` — die installierte App lädt **dieselbe UI wie die Website**. Web-Deploy aktualisiert damit auch TestFlight (nach einmaligem Upload mit dieser Config).
- Menü zeigt `Version … · Live-Web` wenn die Live-Site geladen wird (Kontrolle).
- Nächster Archive-Upload: **Build 101**.
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

## iOS-Bundle (kritisch) — warum Web ≠ TestFlight

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| Nur Web-Deploy auf dem Server | **Nein** — betrifft nur den Browser |
| `git pull` allein | **Teilweise** — ab jetzt liegt `ios/App/App/public` **im Repo** (aktuelles UI) |
| **`npm run build:ios` auf Mac** | **Ja** — frisch bauen + Admin-PIN aus Mac-`.env` + Verify |
| Xcode Archive ohne Pull/Verify | **Nein** — riskiert Alt-Bundle |

Die App nutzt **kein** `server.url` (kein Live-Nachladen der Website). Capacitor packt `ios/App/App/public` fest ein. Deshalb blieb TestFlight auf „Vorschau sperren“, während Web schon „Hausregeln unter Multi“ zeigte.

Repo: Marketing **2.0**, Build **100**. Vor Archive: `npm run verify:ios-web` muss **OK** sein.

## Mac-Workflow (TestFlight) — Build 101 (Live-Web)

Ab diesem Build lädt die App die **Produktions-Website**. Einmal hochladen — danach folgt die UI dem Server.

```bash
cd ~/projects/kniffel
git pull origin milestone-22-prep
git log -1 --oneline
cd frontend
npm run verify:ios-web
npm install
npm run build:ios
```

### In Xcode

1. Clean Build Folder (⇧⌘K) + ggf. Derived Data löschen
2. Marketing **2.0**, Build **101**
3. Archive → TestFlight
4. App **löschen** und aus TestFlight neu installieren (sonst Cache)
5. Kontrolle Menü: `Version 2.0 (101) · Live-Web`
6. Spielregeln → Multi → Hausregeln ohne Code/Sperre

## Bekannte Hinweise

- Web-Menü zeigt `Version 2.0 (web)` — Absicht.
- Agent hat **keinen Mac-Zugriff**; Archive/Upload nur auf dem Mac.
- Backend muss die aktuelle Dist laufen (Effizienz-Scores u. a.); nach Deploy: `sudo systemctl restart kniffel-backend.service`.
