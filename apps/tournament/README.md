# DiceBudget Tournament (Host-App)

Organisations-App für **Events**: **Liga** oder **Turnier**. **Getrennt** von **DiceBudget** (`frontend/`) und dem geplanten **DiceBudget GO**. Produktfamilie: [`docs/tournament/products.md`](../../docs/tournament/products.md).

Jeder mit dieser App kann ein Event eröffnen. Teilnehmer treten per QR bei (GO oder Pro-App) — Join in den Teilnehmer-Apps folgt (T3).

| | |
|--|--|
| Bundle ID | `de.bottletrade.dicebudget.tournament` |
| Dev-Port | **3022** |
| API | `NEXT_PUBLIC_API_URL` (Prod: `https://dicebudget.bottle-trade.de/api`) |

## Regeln

- DiceBudget-Pro-App darf nicht beschädigt werden (siehe `docs/tournament/README.md`).
- Kein Polling: Lobby nur per Tap „Aktualisieren“.
- Nach dem Anlegen: ein Screen, drei Container (Beitritt / Feld / Leitung). iPad quer nebeneinander.
- Design: an DiceBudget Startscreen angelehnt (Navy/Slate/Teal, Gold nur Akzent), eigene Typo (Outfit) — ähnlich, nicht gleich.
- iOS-Native-Projekt: auf dem **Mac** einmalig `npx cap add ios` (falls Ordner `ios/` fehlt), danach `npm run build:ios`.

## Lokal

```bash
cd apps/tournament
cp .env.production.example .env.local
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
npx cap add ios
npm run build:ios
```

In Xcode: Team, Build-Nummer, **Any iOS Device** → Archive → App Store Connect (eigener App-Eintrag, nicht DiceBudget).
