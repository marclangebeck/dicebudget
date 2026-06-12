# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `e198293`  
**Sprache:** Deutsch

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md` (**M30** App Store Release). Aktiver Milestone-Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung.
- Kein `sudo` durch den Agent; Backend-Deploy/nginx reload per SSH auf dem Server (Nutzer).
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel`.
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Produktcode-HEAD | `e198293` — Bugfix Strategy-Würfe / Alle-Fünfe-Eintrag |
| Roadmap | **M27**, **M29** abgenommen; **M30** App Store Release als Nächstes |
| Startscreen (Standard) | **Cinematic Editorial** — gestapelte Poster-Kacheln Multi/Solo; Bilanz-Chip oben; integrierte Glas-CTA; Rollback: `HomeBentoGridClassic` |
| Layout-Umschaltung | `NEXT_PUBLIC_HOME_LAYOUT=cinematic\|classic` in `frontend/.env.production`; `bash infra/scripts/set-home-layout.sh …`; Browser: `localStorage dicebudget.homeLayout` |
| Backend | M23–M26 deployed; M29 (`rebuildLeagueStandings`, Match-Analyse-Auth); Bugfix `e198293` — **Prod-Deploy durch Nutzer bestätigen** |
| Frontend-Tests | 22 Unit-Tests (`npm run test`); Playwright E2E (`npm run test:e2e`, 3 Smoke-Tests) |
| Branding | Nutzer-sichtbar **DiceBudget** und **Alle Fünfe** |
| Footer | `Home · Statistik · Einstellungen · Menü` — Glas-Morph-Menü, Screenshot, Support, Legal |
| Multi-Raum | **Code teilen** nur Code (kein Einladungstext/Link) |
| iOS/TestFlight | Version `2.0`; **Build `2.0 (28)`** mit `d8b5952` (älter als HEAD); nächster Upload nach M30-Regression auf aktuellem HEAD |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle.
- Vor Archive: `git log -1` → aktueller HEAD; Bundle-Check: `grep -c home-cinematic-door` in `ios/App/App/public/_next/static/css/*.css` > 0.

## Letzte Produktänderungen

### `e198293` — Bugfix Multi Alle Fünfe / Strategy-Würfe

| Feature | Backend nötig |
|---------|---------------|
| Kein fixes 20-Würfe-Limit pro Feld; Grenzen nur Pool + Gesamtbudget | **Ja** |
| Wurf-Chips bis `rollsRemaining`; Hinweis wenn bei 50 Punkten kein Würfel 1–6 gewählt | Nein (Frontend) |
| `strategyRollChipOptions()` + Tests in `frontend/lib/gameRules.test.ts` | Nein |

Dateien: `backend/src/domain/gameRules.ts`, `backend/src/services/playField.ts`, `frontend/lib/gameRules.ts`, `frontend/components/ScoreEntryPanel.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`, `frontend/lib/localSoloRun.ts`

### `706d509` — M29 Technische Schulden & Security

- `rebuildLeagueStandings` nach Stats-Reset; Match-Analyse erfordert `X-Player-Secret` oder Session `FINISHED`
- Next.js 15.5.19; Backend `npm audit fix`

### `4d81f50` — M27 Frontend-Tests & Stabilität

- Playwright E2E (`e2e/`), `AppErrorBoundary` für `/app`, `/play`, `/stats`
- Unit-Tests: `gameScoring`, `pairingMerge`, `localSoloRun`, `gameRules`

## Bekanntes UX-Thema (offen)

- **Prod-Backend Bugfix:** Deploy-Skript nur vom **Projektroot**: `sudo bash infra/scripts/deploy-backend-prod.sh`
- **Manueller Test:** Multi — Alle Fünfe (50) im 23.+ Wurf mit Würfelwahl 1–6
- **Safari-/WebView-Cache:** Hard-Reload nach Deploy/TestFlight-Update; nginx reload falls Cache-Header fehlen
- **Mac `git pull`:** vom Projektroot `git restore frontend/package-lock.json`; bereits in `frontend/`: `git restore package-lock.json` oder Schritt weglassen

## Prod-Verifikation & nginx

Einmalig nach Deploy (kein Loop):

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

Optional mit abgeschlossener Multi-Session:

```bash
VERIFY_INVITE=CODE VERIFY_PLAYER=PLAYERID bash infra/scripts/verify-prod-api.sh
```

**Backend-Deploy** (vom Projektroot):

```bash
cd ~/projects/kniffel
sudo bash infra/scripts/deploy-backend-prod.sh
```

**nginx Cache-Header** (HTML `no-cache`, `_next/static/` `immutable`) — reload durch Nutzer:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Prisma-Migration auf Prod: `cd backend && npx prisma migrate status`.

## Wichtige Dateien

- Strategy-Würfe / Alle Fünfe: `frontend/lib/gameRules.ts`, `ScoreEntryPanel.tsx`, `backend/src/domain/gameRules.ts`, `backend/src/services/playField.ts`
- Tests: `frontend/lib/gameRules.test.ts`, `frontend/e2e/`, `frontend/lib/gameScoring.test.ts`
- Startscreen: `HomeBentoGridCinematic.tsx`, `HomeBentoGridClassic.tsx`, `lib/homeLayout.ts`
- Match-Analyse: `MatchAnalysisView.tsx`, `backend/src/services/matchAnalysisService.ts`
- Stats-Reset: `backend/src/services/pairingStats.ts`, `rebuildLeagueStandings`
- Nginx: `infra/nginx/dicebudget.bottle-trade.de.conf`
- Deploy: `infra/scripts/deploy-backend-prod.sh`, `infra/scripts/verify-prod-api.sh`

## Offene Prioritäten

1. **Prod-Backend-Deploy** für `e198293` + manueller Multi-Regressionstest (Alle Fünfe Wurf 23+)
2. **M30 Sprint 30.1** — TestFlight-Regression final (`GO M30`)
3. **M30 Sprint 30.2** — App Store Connect (Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten)
4. iOS-Build auf aktuellem HEAD: `npm run build:ios` → Archive → Upload nächste Build-Nummer
5. `milestone-22-prep` → `main` Merge nach Nutzer-Freigabe post-Release

## Pflicht-Lesereihenfolge

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md` (nur bei Bedarf)

Optional: `docs/ios_current.md`, `docs/milestone-roadmap-analysis.md`, `docs/decisions.md`

## Agent-Start

```text
Du arbeitest an dice.budget (kniffel). Lies AGENT_RULES.md und HANDOVER.md.
Branch milestone-22-prep, HEAD e198293. M27 und M29 abgenommen; Bugfix Strategy-Würfe committed.
Prüfe Prod-Backend-Deploy für e198293, dann M30 App Store Release (Sprint 30.1 Regression).
Keine Commits ohne GO. Antworte auf Deutsch.
```
