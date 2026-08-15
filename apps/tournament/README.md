# DiceBudget Tournament (Host-App)

Host-App zum Orchestrieren von Turnieren. **Getrennt** von der Spieler-App `frontend/` (DiceBudget). Jeder mit dieser App kann ein Turnier eröffnen.

| | |
|--|--|
| Bundle ID | `de.bottletrade.dicebudget.tournament` |
| Dev-Port | **3022** |
| API | `NEXT_PUBLIC_API_URL` (Prod: `https://dicebudget.bottle-trade.de/api`) |

## Regeln

- DiceBudget-Spieler-App darf nicht beschädigt werden (siehe `docs/tournament/README.md`).
- Kein Polling: Lobby nur per Tap „Aktualisieren“.
- Design: an DiceBudget angelehnt (navy/gold), eigene Typo (Outfit) — ähnlich, nicht gleich.
- iOS-Native-Projekt: auf dem **Mac** einmalig `npx cap add ios` (falls Ordner `ios/` fehlt), danach `npm run build:ios`.

## Lokal

```bash
cd apps/tournament
cp .env.production.example .env.local
# optional: NEXT_PUBLIC_API_URL=http://127.0.0.1:3020
npm install
npm run dev
```

Backend parallel in `backend/` (Port 3020).

## Build Web (static)

```bash
cd apps/tournament
npm run build
```

## iOS (nur Mac)

```bash
cd /Users/marclangebeck/projects/kniffel/apps/tournament
npm install
# einmalig, falls noch kein ios/:
npx cap add ios
npm run build:ios
```

In Xcode: Team, Build-Nummer, **Any iOS Device** → Archive → App Store Connect (eigener App-Eintrag).
