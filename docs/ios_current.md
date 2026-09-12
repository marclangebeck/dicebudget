# iOS Aktuell - DiceBudget Strategy Edition

**Stand:** 2026-09-12  
**Branch:** `milestone-22-prep`  
**HEAD:** `905ff1e`  
**Architektur:** **Eingebettetes Capacitor-Bundle** (kein `server.url` / kein Live-Web)  
**TestFlight:** Version **2.0**, Build **103** (bestätigt)  
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

- App Store Connect / TestFlight: **2.0 (103)** — Bundle-Modus, Hausregeln unter Multi (ohne Labs-PIN / InApp-Gate).
- Produktcode: `905ff1e` (Mac und Server abgeglichen).
- `ios/App/App/public` im Git + vor Archive `npm run build:ios` + `verify:ios-web`.
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

## Mac-Workflow — nächster Bundle-Upload

1. In ASC höchste Build-Nr. prüfen → Xcode = höchste + 1.  
2. Pull → Verify → `build:ios` → Clean → Archive.

```bash
cd ~/projects/kniffel
git pull origin milestone-22-prep
cd frontend
npm run verify:ios-web
npm install
npm run build:ios
```

### Kontrolle nach Install (103)

- Menü: `Version 2.0 (103) · Bundle` (nicht Live-Web)
- Spielregeln → Multi → Hausregeln, kein Code/Sperre
- Offline: App-UI startet (Solo)

## Bekannte Hinweise

- Web-Menü kann `· Live-Web` zeigen (Hostname der Website) — Absicht; native App = **Bundle**.
- Agent: kein Mac, kein ASC-Upload.
- Nach API-Änderungen: Backend-Dienst neu starten (sudo).
