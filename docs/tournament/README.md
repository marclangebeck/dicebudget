# DiceBudget Tournament

**Produktname:** DiceBudget Tournament  
**Stand:** 2026-08-19  
**Status:** **T1–T6 umgesetzt** (Backend, Host, Teilnehmer, Beamer); **T9/T10** als Nächstes  
**Produktfamilie:** [`products.md`](./products.md) — **drei Apps** (DiceBudget · Tournament · GO)

## Vision (kurz)

Jeder mit **DiceBudget Tournament** kann ein **Event** eröffnen — **Liga** (Round-Robin, mehrere Runden) oder **Turnier** (Gruppenphase → K.O.). Teilnehmer scannen den QR und spielen ihre Partien in der **bestehenden Multi-Session** (DiceBudget Pro); Ergebnisse fließen automatisch ins Event zurück.

Organisation = Host-App. Mitspielen = DiceBudget Pro (oder später GO). **Kein Peer-to-Peer** — alles über den Server.

## Rollen & Apps

| Rolle | App / URL | Aufgabe |
|-------|-----------|---------|
| **Host** | `apps/tournament` — **nur iOS-App** (`de.bottletrade.dicebudget.tournament`) | Event anlegen, Auslosung, Lobby, Wellen freigeben, Match-Sessions starten |
| **Teilnehmer** | **DiceBudget Pro** (`frontend/`) — Route `/tournament/join` | QR scannen, Match-Fokus, Link zur Partie (`/multi/join`) |
| **Beamer / Wand** | Host-App **`/display?code=EVENTCODE`** | Tabellen, Paarungen, Fokus auf eine laufende Partie |
| **Zuschauer** | Beamer (read-only) | — |

**DiceBudget GO** (nur Event-Join) ist geplant, noch nicht im Repo.

### Was wo gehostet wird

| Komponente | Produktion | Lokal dev |
|------------|------------|-----------|
| **API** | `https://dicebudget.bottle-trade.de/api/` | `http://127.0.0.1:3020` |
| **Teilnehmer-Web** | `https://dicebudget.bottle-trade.de/tournament/join?code=…` (Nginx → `frontend/out/`) | Frontend Port 3021 |
| **Host + Beamer** | **Nicht** auf der Prod-Domain — **installierte Tournament-iOS-App** auf dem Host-iPad | Kein öffentlicher Browser-Zugang |
| **Host dev (Mac)** | `npm run dev` Port **3022** — nur Entwicklung | Browser erlaubt nur im Dev-Modus |

Teilnehmer im **Browser** nutzen die Prod-Website. Teilnehmer in der **installierten Pro-App** brauchen zusätzlich **`frontend` → `npm run build:ios`** (Mac).

## Bildschirme während eines Events

### Host (`HostCockpit` — drei Container)

1. **Beitritt** — Event-QR (Link zur Pro-App `/tournament/join`)
2. **Feld** — angemeldete Spieler
3. **Leitung** — Auslosung vorbereiten, neu mischen, Ereignis starten, nächste Welle freigeben, Beamer-Link

Zusätzlich nach Start: **Gruppen/Tabelle**, **Spielpaarungen** (nach Wellen, Live-Scores, Session starten).

### Teilnehmer (`frontend/app/tournament/join/page.tsx`)

- Lobby / Anmeldung (Status OPEN)
- Bei **RUNNING**: Match-Fokus, Session-Code, Button „Jetzt zur Partie“
- Tabelle, eigene Paarungen, Abschluss bei FINISHED
- **Sanftes Auto-Refresh** alle 45 s (nur RUNNING; pausiert im Hintergrund)

### Beamer (`TournamentDisplayBoard` + Fokus)

- Übersicht: Tabellen + Paarungen, QR in der Lobby-Phase
- **Fokus-Modus**: eine Paarung antippen → Live-Scores (Session-Ranking, ~4 s)
- Refresh Übersicht alle 20 s; Hinweis „Welle X/Y“ wenn weitere Runden noch nicht freigegeben

## Event-Ablauf (Liga / Turnier)

1. Host legt Event an (Wizard: Name, Modus, Größe, Hausregeln)
2. Teilnehmer scannen QR → `/tournament/join?code=…` → beitreten
3. Host: **Auslosung vorbereiten** (optional neu mischen, Spieler tauschen)
4. Host: **Ereignis starten** → Gruppen + **Welle 1** freigegeben
5. Host: pro Match **Session starten** → Teilnehmer sehen Code / Alert → `/multi/join`
6. Partie endet → Ergebnis ins Event, Tabelle aktualisiert
7. Welle komplett → **nächste Welle auto** oder Host „Nächste Runde freigeben“
8. Turnier: nach Gruppenphase → **K.O.-Bracket** (Backend); Liga: Abschluss wenn alle Matches fertig

## Live-Updates (sparsam, mit Nutzer-GO)

| Ansicht | Intervall | Hinweis |
|---------|-----------|---------|
| Teilnehmer-Join | 45 s | nur `RUNNING`; Backoff bei Fehlern |
| Host-Cockpit | 45 s | OPEN + RUNNING |
| Beamer-Übersicht | 20 s | lokal/Host-Gerät |
| Beamer-Fokus | 4 s | nur aktive Paarung |

Kein Polling in **PlayBoard** (Multi-Spiel selbst) — unverändert ereignisbasiert.

## API (Ist, Kurz)

Siehe [`api-sketch.md`](./api-sketch.md). Wichtigste Routen:

- `POST /tournaments` — anlegen (+ `hostToken`)
- `GET /tournaments/invite/:code` — Snapshot (+ optional `scheduleMeta`)
- `POST …/join` — Teilnehmer
- `POST /tournaments/:id/draw` — Auslosung (`prepare` / `shuffle`)
- `PATCH /tournaments/:id/draw` — Paarung tauschen / Spieler zuweisen
- `POST /tournaments/:id/start` — Start (+ Welle 1)
- `POST /tournaments/:id/rounds` — nächste Welle (Host)
- `POST /tournaments/:id/matches/:matchId/session` — Multi-Session

Spielplan liegt intern als `_schedulePlan` in der Tournament-`config` (JSON).

## Deploy & Event vorbereiten

### Server (nach `git pull`)

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm install && npm run build
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
cd ../frontend && npm install && npm run build
```

Frontend = sofort live (Nginx). Backend braucht **sudo-Restart**.

### Mac (optional, für iOS-Apps)

```bash
git pull origin milestone-22-prep
```

| Ziel | Befehl |
|------|--------|
| **Teilnehmer-App** (nur wenn TestFlight/App genutzt) | `cd frontend && npm install && npm run build:ios` |
| **Host-App** | `cd apps/tournament && npm install && npm run build:ios` |

`build:ios` baut das **gesamte** Frontend-Bundle neu; Turnier-Änderungen sind **additiv** — Solo/Multi/Stats bleiben unverändert in der Absicht.

### Smoke vor Feldtest

1. Event anlegen, 2+ Spieler joinen (Web oder App)
2. Auslosung → Start → Session → Partie spielen
3. Beamer `/display?code=…`
4. Solo + Multi-QR kurz (Regression)

## Architektur

- Monorepo: `frontend/` = DiceBudget Pro; `apps/tournament/` = Host; GO später
- Modi: `modeKey` **`league`** | **`turnier`**
- Partien: bestehende **`/sessions`** (Multi-Kern), Event orchestriert via `tournamentMatch.sessionId`

Details: [`roadmap.md`](./roadmap.md) · [`products.md`](./products.md) · [`api-sketch.md`](./api-sketch.md)

---

## Nicht verhandelbar

1. **DiceBudget-Kern unantastbar** — Solo, Multi, Stats, Strategy/Hausregeln, Admin vollwertig ohne Event.
2. **Events nur additiv** — keine Pflicht-Umleitung bestehender Flows.
3. **Getrennte Produkte** — Host = Tournament; Mitspielen = Pro / GO.
4. **Regression** — Backend-/Frontend-Tests grün; Smoke nach größeren Änderungen.
5. **Kein aggressives Polling** — Live-Refresh nur sparsam (siehe Tabelle oben).

## Agent-Lesezeichen

1. `AGENT_RULES.md` → dieses README
2. `HANDOVER.md`
3. [`products.md`](./products.md), [`roadmap.md`](./roadmap.md), [`api-sketch.md`](./api-sketch.md)
