# iOS Aktuell - DiceBudget Strategy Edition

**Stand:** 2026-09-12  
**Branch:** `milestone-22-prep`  
**Architektur:** **Eingebettetes Capacitor-Bundle** (kein `server.url` / kein Live-Web)  
**Repo-Xcode:** Marketing **2.0**, Build **102** (Vorschlag — in App Store Connect gegenhöchsten Upload prüfen)  
**Bundle ID:** `de.bottletrade.dicebudget`  
**Apple Team ID (AASA):** `5QGGV8N5ZD`

Historie: `docs/ios_archive.md`.

## Produkt (Release 2.0)

- **DiceBudget Strategy Edition** — einmaliger App-Kauf; **keine Werbung**; **keine Kern-In-App-Käufe**.
- **Strategy-/Hausregeln** unter Einstellungen → Multi; Bestandteil der App (kein IAP).
- **Kein Login**; Solo weitgehend lokal; Multi/Stats über eigenen Server.
- Multi: QR/Link primär, Raumcode Fallback.
- Datenschutz: https://dicebudget.bottle-trade.de/datenschutz

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- Nutzer zuletzt: TestFlight **98** (99 ggf. versucht). Repo schlägt nächsten Upload **102** vor — **du prüfst in ASC**, ob 100/101 schon existieren; nächste Nummer = höchste + 1.
- **Bundle-Modus wieder aktiv** (Live-Web-Experiment `server.url` zurückgenommen).
- `ios/App/App/public` liegt im Git (aktuelles UI) — trotzdem vor Archive immer `build:ios` + `verify:ios-web`.
- Deployment Target: **15.0**.
- Admin: `NEXT_PUBLIC_ADMIN_PIN`; API-Key lokal, nicht im Bundle.

## Warum Web ≠ TestFlight (wenn Sync fehlt)

| Schritt | Neue UI in TestFlight? |
|---------|------------------------|
| Nur Web-Deploy (`frontend/out`) | Nein |
| `git pull` (mit aktuellem `public` im Repo) | Oft ja, aber riskant ohne Verify |
| **`npm run build:ios` + Verify** | Ja |
| Archive ohne Sync/Verify | Nein — altes Bundle |

## Mac `.env.production`

| Variable | Zweck |
|----------|--------|
| `NEXT_PUBLIC_ADMIN_PIN` | Admin freischalten |
| `NEXT_PUBLIC_ADMIN_API_KEY` | **leer** |
| `NEXT_PUBLIC_APP_VERSION` | `2.0` |
| `NEXT_PUBLIC_SITE_URL` | `https://dicebudget.bottle-trade.de` |

## Mac-Workflow — Bundle-Upload

**1. Build-Nummer in ASC prüfen** (TestFlight → Version 2.0 → höchste Build-Nr.).  
**2. In Xcode dieselbe Nummer + 1 setzen** (Repo-Vorschlag: **102**, nur wenn ASC ≤ 101).

```bash
cd ~/projects/kniffel
git pull origin milestone-22-prep
git log -1 --oneline
cd frontend
npm run verify:ios-web
# Erwartung: OK Bundle-Modus + Hausregeln, KEIN server.url
npm install
npm run build:ios
```

### In Xcode

1. Clean Build Folder (⇧⌘K)
2. Marketing **2.0**, Build = **ASC-höchste + 1**
3. Any iOS Device → Archive → TestFlight (kein Submit for Review)
4. App löschen und neu installieren
5. Menü: `Version 2.0 (N) · Bundle` (nicht Live-Web)
6. Spielregeln → Multi → Hausregeln, kein Code/Sperre

## TestFlight-Checkliste

- [ ] Menü endet mit **Bundle**, nicht Live-Web  
- [ ] Hausregeln unter Multi  
- [ ] Offline: App-UI startet (Solo)  
- [ ] QR/Multi/Stats wie bisher  

## Bekannte Hinweise

- Web-Menü: `Version 2.0 (web) · Live-Web` auf der Website — Absicht (Hostname).
- Agent: kein Mac, kein ASC-Upload.
- Nach API-Änderungen: Backend-Dienst neu starten (sudo).
