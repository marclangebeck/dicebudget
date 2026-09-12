# GOiOS - DiceBudget Strategy Edition

Kompatibilitäts-Index. Aktueller iOS-/TestFlight-Stand: **`docs/ios_current.md`**.

## Aktuell

- Aktueller iOS-Stand: `docs/ios_current.md`
- Ältere Historie: `docs/ios_archive.md`
- Xcode-Einsteiger: `docs/ios-xcode-anleitung.md`
- App-Store-Connect: `docs/testflight-app-store.md`
- Turnier-Host: `docs/tournament/` · Produktfamilie: `docs/tournament/products.md`

## Kurzstand (Release 2.0 / 103)

- Bundle ID: `de.bottletrade.dicebudget`
- Marketing Version: **2.0**
- TestFlight Build: **103** (Bundle-Modus, HEAD `905ff1e`)
- Deployment Target: **15.0**
- Strategy Edition: Bestandteil des App-Kaufs; keine Werbung; keine Kern-IAP
- Multi: QR/Link primär, Raumcode Fallback
- Kein Login; Solo lokal; Multi/Stats Server
- Nächster organisatorischer Schritt: **M30** Submit (Nutzer-GO)
- Drei Apps: Pro + Tournament + GO (geplant). `npm run build:ios` in `frontend/` = nur Pro.

## Wichtig

- Web-Deploy ≠ iOS-Release; `ios/App/App/public/` gitignored.
- Nach UI: Mac pull → `npm install` → `npm run build:ios` → Archive/Upload.
- Menü-Version iOS = Xcode Build; Web = `NEXT_PUBLIC_APP_*`.
- Admin: `NEXT_PUBLIC_ADMIN_PIN`; Admin-API-Key leer im Bundle.
- Agent: kein Mac, kein sudo (`docs/decisions.md`).
