# DiceBudget Backend API

Express + Prisma (SQLite) — Port **3020** (Produktion hinter Nginx `/api/`).

Event-API (`/tournaments`) ist **umgesetzt** (T1); Join-UI in den Teilnehmer-Apps folgt. Bestehende Session-/Run-Routen bleiben der Kern; Events orchestrieren, ersetzen nicht. Produktfamilie: `docs/tournament/products.md`. **Hart:** bestehende Funktionalität nicht brechen.

## Voraussetzungen

- Node.js ≥ 20
- `backend/.env` mit `DATABASE_URL` (z. B. `file:./prisma/dev.db`)

## Entwicklung

```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

Manuell starten, danach mit `Ctrl+C` beenden (kein Dauerbetrieb auf dem Server durch Agents).

## Tests

```bash
npm test
```

Nutzt `prisma/test.db` und `supertest` für Route-Tests.

## Build & Produktion

```bash
npm run build
npm start
```

Deploy auf dem Server (Nutzer, sudo):

```bash
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

Nach Schema-Änderungen:

```bash
npx prisma migrate deploy
```

## Skripte

| Befehl | Zweck |
|--------|--------|
| `npm run db:create-run -- 3` | Test-Run anlegen |
| `npm run db:backfill-scored-sequences` | Legacy `scoredSequence` einmalig nachziehen |

## API-Dokumentation

- OpenAPI: [`openapi.yaml`](./openapi.yaml)
- Health: `GET /health`

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|----------------|
| `DATABASE_URL` | SQLite-Pfad |
| `ADMIN_API_KEY` | Admin-Endpunkte (`/stats/pairings/*`, `/player-names/aliases` POST/DELETE) |
| `PORT` | Standard 3020 |
