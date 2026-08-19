# DiceBudget Tournament (Host-App)

Organisations-App für **Events**: **Liga** oder **Turnier**. **Getrennt** von **DiceBudget Pro** (`frontend/`) und dem geplanten **DiceBudget GO**.

| | |
|--|--|
| Bundle ID | `de.bottletrade.dicebudget.tournament` |
| Dev-Port | **3022** |
| API | `NEXT_PUBLIC_API_URL` → Prod: `https://dicebudget.bottle-trade.de/api` |

Vollständige Doku: [`docs/tournament/README.md`](../../docs/tournament/README.md)

## Funktionen (Ist)

- Event-Wizard (Name, Liga/Turnier, Größe, Hausregeln)
- **Host-Cockpit:** Beitritt-QR, Feld, Leitung
- **Auslosung:** Vorschau, neu mischen, Spieler per Dropdown tauschen
- **Spielplan-Wellen:** Start gibt Welle 1 frei; manuell oder auto nächste Welle
- **Match-Sessions** starten (verknüpft mit Multi-API)
- **Beamer:** `/display?code=EVENTCODE` (+ Fokus auf Paarung)
- **Live-Refresh:** Cockpit 45 s, Beamer 20 s / Fokus 4 s (sparsam, pausiert im Hintergrund)

Teilnehmer nutzen **DiceBudget Pro** (`/tournament/join`) — nicht diese App.

## Regeln

- DiceBudget-Pro-Kern nicht beschädigen (`docs/tournament/README.md`).
- Kein aggressives Polling; Refresh-Intervalle siehe Tournament-README.
- Nach dem Anlegen: Lobby auf **Start** (`index.html`), drei Container — keine Capacitor-`/host`-Route.
- iOS: `build:ios` → Verify `OK: Cockpit-UI`, iPad Landscape, dann Archive.

## Lokal (Event-Test)

```bash
cd apps/tournament
cp .env.production.example .env.local   # einmalig
npm install
npm run dev
```

- Host: http://localhost:3022  
- Beamer: http://localhost:3022/display?code=EVENTCODE  

Backend muss erreichbar sein (Prod-API in `.env.local` oder lokal Port 3020).

## Build Web (static, optional)

```bash
cd apps/tournament
npm run build
```

Nicht auf `dicebudget.bottle-trade.de` deployt — Host/Beamer laufen auf dem Event-Gerät.

## iOS (nur Mac)

```bash
cd apps/tournament
npm install
npm run build:ios
```

Xcode: Scheme **DiceBudget Tournament** → **Product → Archive** → TestFlight.  
Nicht das DiceBudget-Pro-Projekt (`frontend/ios`) archivieren.

## Zwei iOS-Apps beim Event

| App | Ordner | Rolle |
|-----|--------|--------|
| **DiceBudget Tournament** | `apps/tournament` | Host + Beamer |
| **DiceBudget Pro** | `frontend` | Teilnehmer (nur wenn installierte App statt Browser) |
