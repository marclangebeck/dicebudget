# DiceBudget Strategy Edition

Strategische Würfelspiel-Variante mit Wurf-Pool und wählbarer Spielanzahl (1–6). Optional **DiceBudget Klassisch** ohne Pool-Mechanik (Toggle beim Solo-Start bzw. Host beim Raum erstellen).

**Produktion:** https://dicebudget.bottle-trade.de

Weitere Dokumentation:

- **[HANDOVER.md](./HANDOVER.md)** – Übergabe für neue Agents (Stand, offene Punkte)
- **[AGENT_RULES.md](./AGENT_RULES.md)** – verbindlich: kein Abuse-Risiko (keine Loops/Dauerprozesse)
- [projektbeschreibung.md](./projektbeschreibung.md) – fachliche und technische Spezifikation
- [milestones.md](./milestones.md) – Meilensteine und Status
- [CHANGELOG.md](./CHANGELOG.md) – Änderungshistorie

## Projektstruktur

```
kniffel/
├── backend/          # Express + TypeScript (API, Port 3020)
├── frontend/         # Next.js 15 (UI, static export → out/)
├── public/           # Statische Assets (Logo, Legacy-Verifikation)
└── infra/            # Nginx & Deploy-Skripte
```

## Lokale Ports

| Dienst   | Port | URL |
|----------|------|-----|
| Backend  | 3020 | http://127.0.0.1:3020/health |
| Frontend | 3021 | http://127.0.0.1:3021 |

Lokal zeigt das Frontend auf `http://127.0.0.1:3020` (ohne `/api`-Prefix). Produktion: `NEXT_PUBLIC_API_URL=https://dicebudget.bottle-trade.de/api` (siehe `frontend/.env.production`).

| URL | Inhalt |
|-----|--------|
| `/` | Landingpage **dice.budget** |
| `/app` | Spiel-Start (Bento) |
| `/datenschutz` | Datenschutzerklärung (App Store) |
| `/impressum` | Impressum |

## API (Kurzüberblick)

Backend muss laufen (`npm run dev` in `backend/` — danach `Ctrl+C`).

| Methode | Pfad | Body / Hinweis |
|---------|------|----------------|
| `GET` | `/health` | — |
| `POST` | `/runs` | `{ "gameCount": 1–6, "useStrategyRules": true }` |
| `GET` | `/runs/:id` | MP: Header `X-Player-Secret` |
| `POST` | `/runs/:runId/fields/:fieldId/complete` | `{ "score", "rollsUsed" }` |
| `POST` | `/runs/:runId/fields/:fieldId/clear` | Nur **letztes** eingetragenes Feld (MP: Secret) |
| `POST` | `/runs/:runId/extra-yatzy` | Zusatz-Yatzy (+100 rotierend pro Spielblock) |
| `POST` | `/runs/:runId/finish` | Alle Felder bewertet |
| `POST` | `/runs/:runId/abandon` | Vorzeitig beenden |
| `GET` | `/stats` | Persönliche Rekorde (abgeschlossene Runs) |
| `GET` | `/stats/pairings` | Alle Zweier-Paarungen (Multiplayer, pseudonym) |
| `GET` | `/stats/pairing?key=…` | Paarungsdetail inkl. App-Runden |
| `POST` | `/sessions` | `{ "gameCount", "maxPlayers", "useStrategyRules", "leagueCode"? }` |
| `GET` | `/sessions/invite/:code` | Lobby inkl. Serie |
| `POST` | `/sessions/invite/:code/join` | `{ "playerId" }` → `secretToken`, `runId` |
| `GET` | `/sessions/invite/:code/ranking` | Rangliste Runde + **Serienpunkte** |

Details: [projektbeschreibung.md](./projektbeschreibung.md)

## Frontend-Routen

| Pfad | Beschreibung |
|------|----------------|
| `/` | Landingpage |
| `/app` | Bento-Startscreen (Raum erstellen, Einzelspiel, Statistik, Code-Zeile) |
| `/solo` | Solo-Setup mit Modus-Toggle (`AppScreenHeader`) |
| `/play` | Spielzettel (Vollbild, kein Seiten-Scroll im aktiven Spiel) |
| `/multi` | Raum erstellen (Host, modernisiertes Setup) |
| `/multi/join?code=…` | Lobby, Rangliste, neue Serie-Runde |
| `/stats` | Paarungen, lokale Gegner-Aliase |
| `/stats/pairing?key=…` | Paarungsdetail |
| `/datenschutz` | Datenschutzerklärung |
| `/impressum` | Impressum |

Statischer Export: Join- und Paarungs-URLs nutzen Query-Parameter (keine dynamischen `[param]`-Segmente).

## Datenbank

SQLite: `backend/prisma/dev.db`

```bash
cd backend
cp .env.example .env   # einmalig
npm install
npx prisma migrate deploy   # nach Pull / Schema-Änderung
npm run db:create-run -- 3   # Test-Run (Strategy)
```

## Tests (Backend)

Kein laufender API-Server nötig. Verwendet `backend/prisma/test.db` (nicht `dev.db`):

```bash
cd backend
npm test
```

Aktuell **37 Tests** (Scoring, Pool, Score-Validierung, Liga-Punkte, Paarungen, Namen).

## Entwicklung starten

**Backend** (Terminal 1):

```bash
cd backend
npm install
npm run dev
```

**Frontend** (Terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Spielen: http://127.0.0.1:3021

## Produktion

```bash
# Gesamt (Backend + Frontend + Nginx)
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-prod.sh

# Oder getrennt:
sudo bash infra/scripts/deploy-backend-prod.sh
sudo bash infra/scripts/deploy-frontend-prod.sh
```

Vor Frontend-Build (falls ohne Deploy-Skript):

```bash
cd frontend
# .env.production enthält NEXT_PUBLIC_API_URL
npm run build
```

- Frontend: `frontend/out/` (statisch, Nginx)
- API: `https://dicebudget.bottle-trade.de/api/` → Backend Port 3020
- Datenschutz: `https://dicebudget.bottle-trade.de/datenschutz`

Nach Deploy: Hard-Refresh im Browser, falls alte JS-Chunks gecacht sind.

## Milestone-Status (Kurz)

| Block | Inhalt | Status |
|-------|--------|--------|
| 1–6 | Grundgerüst, Scoring, Abschluss | erledigt |
| 7–10 | Statistik (Basis), Multiplayer | erledigt |
| 11–14 | UX, Modi, Validierung, Tests | erledigt |
| 15–19 | Liga, Paarungsstatistik, Namen, Feld löschen, Zusatz-Yatzy | erledigt |
| 20 | UI-Modernisierung (Bento, Statistik, Setup, Spielzettel) | erledigt |
| 21 | iOS-App (Capacitor), TestFlight Build 10 | in Arbeit — **[GOiOS.md](./GOiOS.md)** |
| 22 | Datenschutz-Umbau (pseudonym, lokales Solo) | erledigt |
| 23–27 | UI/Branding iOS (Navigation, Icons, Hintergrund, Legal) | erledigt |

Siehe [milestones.md](./milestones.md) für Details.
