# DiceBudget Tournament (Host-App)

Organisations-App für **Events**: **Liga** oder **Turnier**. **Nur als iOS-App** (Capacitor) — kein Browser-Produkt.

| | |
|--|--|
| Bundle ID | `de.bottletrade.dicebudget.tournament` |
| API | `NEXT_PUBLIC_API_URL` → Prod: `https://dicebudget.bottle-trade.de/api` |

Vollständige Doku: [`docs/tournament/README.md`](../../docs/tournament/README.md)

## Funktionen (Ist)

- Event Studio (Name, Liga/Turnier, Größe, Hausregeln)
- **Host-Cockpit:** Beitritt-QR, Feld, Leitung
- **Auslosung:** Vorschau, neu mischen, Spieler per Dropdown tauschen
- **Spielplan-Wellen:** Start gibt Welle 1 frei; manuell oder auto nächste Welle
- **Match-Sessions** starten (verknüpft mit Multi-API)
- **Beamer:** `/display?code=EVENTCODE` (in der App)
- **Live-Refresh:** Cockpit 45 s, Beamer 20 s / Fokus 4 s

Teilnehmer nutzen **DiceBudget Pro** (`/tournament/join`) — nicht diese App.

## Nur iOS — kein Browser

Production-Builds blockieren den Browser (`NativeOnlyGate`). **`npm run dev`** bleibt für Entwicklung am Mac (Port 3022).

Optional zum Testen im Browser: `NEXT_PUBLIC_ALLOW_BROWSER=1` in `.env.local`.

## Lokal entwickeln (Mac)

```bash
cd apps/tournament
cp .env.production.example .env.local   # einmalig
npm install
npm run dev
```

- Nur während `npm run dev`: http://localhost:3022  
- Beamer-Test: http://localhost:3022/display?code=EVENTCODE  

Backend muss erreichbar sein (Prod-API in `.env.local` oder lokal Port 3020).

## Build für iOS (Mac)

```bash
cd apps/tournament
npm install
npm run build:ios
```

`build:ios` führt intern `npm run build` aus (static export → `out/` → Capacitor sync).

Xcode: Scheme **DiceBudget Tournament** → **Product → Archive** → TestFlight.

## Zwei iOS-Apps beim Event

| App | Ordner | Rolle |
|-----|--------|--------|
| **DiceBudget Tournament** | `apps/tournament` | Host + Beamer |
| **DiceBudget Pro** | `frontend` | Teilnehmer |

## Server: Browser-Dev abschalten

Tournament soll **nicht** dauerhaft als `next dev` auf dem Server laufen:

```bash
kill $(lsof -t -i:3022) 2>/dev/null || true
```
