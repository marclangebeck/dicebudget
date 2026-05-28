# Übergabe-Prompt – DiceBudget Strategy Edition

**Zweck:** Diesen Abschnitt (ab „Prompt für neuen Agent“) an einen neuen Cursor-Agent kopieren, damit nahtlos weitergearbeitet werden kann.

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Sprache Antworten:** Deutsch  
**Letzte inhaltliche Session:** Mai 2026 – UI-Modernisierung (Bento, Statistik, Setup, Spielzettel ohne Scroll), Docs

## Update 2026-05-28 (verbindlicher Ist-Stand)

- iOS/TestFlight Upload ist bis Build `1.0 (9)` erfolgreich.
- Ursache fuer vorherige Upload-Fehler war ein lokaler `rsync`-PATH-Konflikt auf dem Mac (Homebrew-`rsync` statt `/usr/bin/rsync`).
- Datenschutz-Umbau (Milestone 22) bleibt abgeschlossen.
- UI/Branding-Folgepaket ist **nicht** voll abgenommen:
  - `Startseite`-Button weiterhin nicht wie gewuenscht.
  - `Datenschutz`/`Impressum` auf dem Auswahlscreen (`/app`) laut iOS-Abnahme weiterhin nicht sichtbar.
  - Icon-Optik auf dem Auswahlscreen entspricht nicht der Nutzervorgabe.
- Folgearbeiten laufen in Milestones 23, 26 und 27 (Status: in Arbeit).

---

## Prompt für neuen Agent

Du arbeitest am Projekt **DiceBudget Strategy Edition** (Repo-Ordner: `kniffel`) weiter. Lies zuerst **`AGENT_RULES.md`** (Server-Safety, keine Polling-Loops, kein `npm run dev` dauerhaft auf Produktion) und dann diese Datei.

### Was das Projekt ist

- **Yatzy/Kniffel** mit wählbarer **Spielanzahl 1–6** (jede Spalte = ein Block mit 13 Feldern).
- **Zwei Modi:** Strategy (`useStrategyRules: true`, Pool + Würfe) vs. Klassisch (nur Punkte).
- **Singleplayer:** `/solo` → `/play?runId=…`
- **Multiplayer:** Host `/multi` → Code → `/multi/join?code=…` → `/play` mit `X-Player-Secret` in `sessionStorage`.
- **Serien:** Mehrere Runden mit gleichem `leagueCode`; Ligapunkte (Sieger +1, Bonus = Differenz zum Letzten).
- **Statistik:** `/stats` — Paarungen, Namen zusammenführen; Detail `/stats/pairing?key=A::B`.

### Tech-Stack

| Teil | Stack |
|------|--------|
| Backend | Express, TypeScript, Prisma, SQLite (`dev.db`), Port **3020** |
| Frontend | Next.js 15, Tailwind v4, **static export** (`out/`), Dev **3021** |
| Prod | `https://dicebudget.bottle-trade.de` — Nginx statisch + `/api/` → Backend |
**URLs:** Landing `/`, App `/app`, Datenschutz `/datenschutz` (App Store)

**API-URL im Build:** `frontend/.env.production` → `NEXT_PUBLIC_API_URL=https://dicebudget.bottle-trade.de/api`

### Wichtige Dateien

```
backend/prisma/schema.prisma       # League, PairingManualBaseline, PlayerNameAlias, scored_sequence
backend/src/services/playField.ts  # complete, clearLastField, extraYatzy, finish, abandon
backend/src/services/sessionService.ts
backend/src/services/leaguePoints.ts
backend/src/services/pairingStats.ts
backend/src/services/playerNames.ts
backend/src/domain/fieldScores.ts  # Score-Validierung

frontend/app/(home)/page.tsx          # Bento-Start
frontend/app/stats/page.tsx
frontend/app/stats/pairing/page.tsx
frontend/app/solo/page.tsx
frontend/app/multi/page.tsx
frontend/app/play/page.tsx
frontend/app/multi/join/page.tsx   # Liga-Rangliste, neue Runde
frontend/components/HomeBentoGrid.tsx
frontend/components/AppScreenHeader.tsx
frontend/components/PlayBoard.tsx
frontend/components/PlayTopBar.tsx
frontend/components/FitScoreSheet.tsx
frontend/components/ScoreEntryPanel.tsx
frontend/components/NameMergePanel.tsx
frontend/app/globals.css           # .home-bento-*, .stats-*, .play-*
frontend/lib/api.ts
frontend/lib/normalizePairing.ts
frontend/.env.production
```

### API-Kurzreferenz

- `POST /sessions` → `{ gameCount, maxPlayers, useStrategyRules, leagueCode? }`
- `POST /runs` → `{ gameCount, useStrategyRules? }`
- `POST …/complete` → `{ score, rollsUsed }`
- `POST …/clear` → nur letztes Feld
- `POST …/extra-yatzy`, `…/finish`, `…/abandon`
- `GET /stats/pairings`, `/stats/pairing?key=`, `/stats/names`, `POST|DELETE /stats/names/merge`
- MP: Header `X-Player-Secret`

### Bereits umgesetzt (nicht neu erfinden)

- Milestones **1–14** (Grundgerüst, MP, Modi, Validierung, Tests)
- Milestones **15–19** (Liga, Paarungen, Namen, Feld löschen, Zusatz-Yatzy) — siehe `milestones.md`
- Milestone **20** (UI: Bento-Start, Statistik/Setup, Spielzettel ohne Seiten-Scroll)
- Zettel, Overlay, PWA, Resume, helles UI; `HomeModeButtons` entfernt
- Manuelle Baseline Marc/Nicole Langebeck in Migration `20260523220000_pairing_manual_baselines`
- **37** Backend-Tests: `cd backend && npm test`

### Deploy

```bash
sudo bash infra/scripts/deploy-prod.sh          # alles
sudo bash infra/scripts/deploy-backend-prod.sh  # nur API + migrate
sudo bash infra/scripts/deploy-frontend-prod.sh # nur out/ + nginx
```

Nach Schema-Änderung: `npx prisma migrate deploy` im Backend.

**Keine Commits** erstellen, es sei denn, der Nutzer verlangt es explizit.

### Bekannte Stolpersteine

- Frontend-Build **ohne** `.env.production` → API zeigt auf `127.0.0.1:3020` (auf Prod unbrauchbar).
- Statischer Export: Paarungs-Links als `<a href>` (voller Load), nicht nur Client-Router.
- Nach Deploy: Nutzer ggf. **Hard-Refresh** (alte JS-Chunks).

### iOS-App (Capacitor, Milestone 21)

- **Hauptdoku:** **[GOiOS.md](./GOiOS.md)** (Prozess, Milestones 21.x, **Prompt für neuen Agent** am Ende)
- Basis im Repo: `frontend/ios/`, `npm run build:ios`
- Bundle ID: `de.bottletrade.dicebudget` — **nicht** `com.mlangebeck.mobileapp` (alter Connect-Eintrag)
- GitHub: https://github.com/marclangebeck/dicebudget
- Ziel: App **1,19 €**, TestFlight, dann Review
- Simulator auf Mac: OK; Archive/Connect: offen

### Milestone 22 (Datenschutz-Umbau) – aktueller Zwischenstand

- Branch: `milestone-22-prep`
- Tag 1-3 umgesetzt und ausgerollt.
- Multiplayer-Join nutzt jetzt `playerId` (UUID) statt Klarname.
- Server speichert neue Multiplayer-Teilnehmer pseudonym als `pid:<uuid>`.
- Lobby/Ranking/Pairing liefern `playerId` statt `name`.
- Name-Merge-Routen in `stats` sind aus dem aktiven API-Pfad entfernt.
- Datenbereinigungsmigration vorbereitet:
  - `backend/prisma/migrations/20260528093000_m22_pseudonymous_cleanup/migration.sql`
  - entfernt Baselines/Aliase und Legacy-Klarnamen-Multiplayerdaten.
- Frontend nutzt lokale IDs/Labels (`frontend/lib/playerIdentity.ts`).
- Solo-Run-Logik ist lokal auf dem Geraet umgesetzt (`frontend/lib/localSoloRun.ts`), inkl. lokalem Scoring (`frontend/lib/gameScoring.ts`).
- Datenschutzseite wurde auf pseudonyme Multiplayer-Speicherung angepasst.
- Rollout erfolgreich:
  - Backend + Migration auf Server deployed
  - Frontend auf Server deployed
  - iOS Build `1.0 (2)` in TestFlight, Testerzugriff bestaetigt

### Geplante / optionale nächste Schritte

- Admin-UI für manuelle Paarungs-Baselines (aktuell nur DB/Migration)
- Frontend-Tests, E2E
- Variante „echtes Online-Spiel“ (Sync) — bewusst zurückgestellt

### Gesprächskontext (Nutzerpräferenzen)

- Antworten auf **Deutsch**, präzise, gut lesbar.
- Keine unnötigen Markdown-Dateien oder Drive-by-Refactors (außer explizit gewünscht).
- Gesamtergebnis = Summe „Ergebnis Spiel“; Ligapunkte separat (Siege + Differenz-Bonus).

### Wenn du unsicher bist

- Lies `projektbeschreibung.md` und `milestones.md`.
- Lokal: `backend/npm run dev` + `frontend/npm run dev`.
- Frage den Nutzer vor systemd/Nginx-Änderungen außerhalb `infra/`.

---

## Schnellcheck nach Checkout

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm install && npx prisma migrate deploy && npm test
cd /home/bottleadmin/projects/kniffel/frontend && npm install && npm run build
```

Health (Backend muss laufen): `curl -s http://127.0.0.1:3020/health`

---

*Ende Übergabe-Prompt – bei Fortsetzung `CHANGELOG.md` und ggf. diese Datei aktualisieren.*
