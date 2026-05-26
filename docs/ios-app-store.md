# dice.budget — iOS (Capacitor)

## Voraussetzungen

- Apple Developer Program (vorhanden)
- **Mac mit Xcode** (Build/Archive geht nicht auf dem Linux-Server)
- Node.js, CocoaPods (`sudo gem install cocoapods`)

## Projekt

| Einstellung | Wert |
|-------------|------|
| App-Name | dice.budget |
| Bundle ID | `de.bottletrade.dicebudget` |
| API (nativ) | `https://dicebudget.bottle-trade.de/api` |
| Datenschutz-URL | https://dicebudget.bottle-trade.de/datenschutz |
| Web-Assets | `frontend/out/` nach `cap sync` |

## Workflow (auf dem Mac)

```bash
cd frontend
npm install
npm run build:ios          # next build + cap sync ios
npx cap open ios           # Xcode öffnen
```

In Xcode:

1. **Signing & Capabilities** — Team, Bundle ID `de.bottletrade.dicebudget`
2. **App Icons** — aus `public/icon-512.png` / Asset Catalog
3. Simulator oder Gerät starten (▶)
4. **Product → Archive** → **Distribute App** → App Store Connect / TestFlight

## Web vs. iOS

| | Browser | iOS-App |
|---|---------|---------|
| Start | Landing `/` | direkt `/app` |
| API | `/api` (same-origin) | `https://dicebudget.bottle-trade.de/api` |

Die Web-App unter https://dicebudget.bottle-trade.de bleibt unverändert deploybar (`deploy-frontend-prod.sh`).

## App Store Connect (Kurz)

- **Privacy Policy URL:** https://dicebudget.bottle-trade.de/datenschutz
- **Kategorie:** Spiele
- **Netzwerk:** erforderlich (kein Offline-Spiel)
- Screenshots aus Simulator (6.7" iPhone)

## Nach UI-Änderungen

```bash
npm run build:ios
# In Xcode erneut archivieren
```
