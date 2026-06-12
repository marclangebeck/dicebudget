# Milestone-Roadmap — Umsetzung Projektanalyse

**Erstellt:** 2026-06-11  
**Aktualisiert:** 2026-06-11 (M27, M29, Bugfix abgenommen)  
**Basis:** Vollständige Projektanalyse (Backend, Frontend, Release)  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `e198293`  
**Nächster Milestone:** **M30** App Store Release  
**Arbeitsweise:** Pro Milestone ein **GO** vom Nutzer, danach Umsetzung in Sprints, dann Abnahme.

Dieses Dokument ergänzt `docs/milestones_active.md`. Nach Abschluss eines Milestones: Eintrag in `CHANGELOG.md`, Update `HANDOVER.md`, optional Archivierung hier.

---

## Übersicht

| Milestone | Titel | Sprints | Geschätzte Dauer | Release-Relevanz |
|-----------|-------|---------|------------------|------------------|
| **M23** | Sicherheit & API-Härtung | 3 | 1–2 Agent-Sessions | **Blocker App Store** — **abgenommen 2026-06-11** |
| **M24** | UX-Blocker & Deploy-Verifikation | 3 | 1–2 Agent-Sessions | **Blocker App Store** — **abgenommen 2026-06-11** |
| **M25** | Backend-Performance | 3 | 1–2 Agent-Sessions | Empfohlen vor Release — **abgenommen 2026-06-11** |
| **M26** | Backend-Qualität & Tests | 3 | 2 Agent-Sessions | Empfohlen vor Release — **abgenommen 2026-06-11** |
| **M27** | Frontend-Tests & Stabilität | 3 | 2 Agent-Sessions | Empfohlen vor Release — **abgenommen 2026-06-11** |
| **M28** | Frontend-Architektur & Bundle | 3 | 2–3 Agent-Sessions | Nach Release möglich |
| **M29** | Technische Schulden & Security-Patch | 3 | 1–2 Agent-Sessions | Empfohlen vor Release — **abgenommen 2026-06-11** |
| **M30** | App Store Release (organisatorisch) | 3 | 1–2 Wochen (Nutzer + Apple) | **Release — als Nächstes** |
| **M31** | Post-Release v1.1 — Plattform | 3 | 2–3 Agent-Sessions | v1.1 |
| **M32** | DevOps & Betrieb | 3 | 1–2 Agent-Sessions | v1.1 |
| **M33** | Produkt v1.2 — Komfort | 3 | 2–3 Agent-Sessions | v1.2 |
| **M34** | Skalierung (nur bei Bedarf) | 2 | Planung + GO | v2.x |

**Empfohlene Release-Reihenfolge:** M23 → M24 → (M25–M27 parallel möglich) → M29 → M30 → M28/M31+

---

## Agent-Handoff — Wann neuen Agent instruieren?

Der Kontext eines Agent-Chats nähert sich bei **~80–90 %** der Kapazität an Grenzen (lange Dateien, viele Tool-Calls, große Diffs). **Neuen Agent starten**, wenn einer der Punkte zutrifft:

| Signal | Aktion |
|--------|--------|
| Milestone **abgeschlossen und abgenommen** | Immer neuer Agent für nächsten Milestone |
| **≥ 2 Sprints** in einem Chat umgesetzt | Neuer Agent ab nächstem Sprint |
| Große Refactors (`PlayBoard`, `globals.css`) begonnen | Neuer Agent nur für Fortsetzung desselben Sprints |
| Kontext-Warnung / Antworten werden ungenau | Sofort neuer Agent |
| `[Server]` commit+push erledigt, neuer Milestone startet | Neuer Agent |

### Start-Prompt für Folge-Agent (kopieren)

**Aktuell (M30):** siehe `HANDOVER.md` Agent-Start und Abschnitt M30 unten.

**Allgemeine Vorlage:**

```text
Du arbeitest an dice.budget (kniffel). Lies AGENT_RULES.md und HANDOVER.md.
Umsetze Milestone [NUMMER] aus docs/milestone-roadmap-analysis.md — Sprint [X.Y].
Vorherige Milestones [LISTE] sind abgenommen. GO vom Nutzer liegt vor.
milestones_active.md nur bei Bedarf.
```

### Nach jedem abgeschlossenen Sprint (Agent → Nutzer)

Nummerierte `[Server]`/`[Mac]`-Befehle gemäß `AGENT_RULES.md` Sektion 9 ausgeben. Nutzer gibt GO für nächsten Sprint oder Milestone.

---

## M23 — Sicherheit & API-Härtung

**Ziel:** Alle kritischen Sicherheitslücken aus der Analyse schließen, bevor die App öffentlich kostenpflichtig wird.

### Sprint 23.1 — Admin-Auth für Stats-Endpunkte

| # | Aufgabe | Dateien (voraussichtlich) |
|---|---------|---------------------------|
| 1 | Env `ADMIN_API_KEY` in `.env.example` + Backend-Config | `backend/.env.example`, `backend/src/config.ts` |
| 2 | Middleware `adminAuth.ts` prüft Header `X-Admin-Key` | `backend/src/middleware/adminAuth.ts` |
| 3 | Schutz `POST /stats/pairings/reset` und `POST /stats/pairings/baseline` | `backend/src/routes/stats.ts` |
| 4 | Frontend sendet Key aus `NEXT_PUBLIC_ADMIN_API_KEY` oder nur in Settings (Entscheidung: Key nur serverseitig, Frontend ruft über geschützten Flow — **empfohlen:** Key in Frontend `.env.production`, da Stats-UI es braucht) | `frontend/lib/api.ts`, `frontend/.env.production.example` |
| 5 | Tests für 401/403 ohne Key | `backend/src/routes/stats.test.ts` (neu) |
| 6 | `CHANGELOG.md`, `docs/decisions.md` aktualisieren | Doku |

### Sprint 23.2 — Rate-Limiting & Join-Integrität

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `express-rate-limit` auf `POST /runs`, `POST /sessions`, `POST .../join` (z. B. 30/min/IP) | `backend/src/index.ts`, `package.json` |
| 2 | Duplikat-Check: gleiche `playerId` darf Session nicht zweimal belegen | `backend/src/services/sessionService.ts` |
| 3 | `express.json({ limit: '100kb' })` explizit setzen | `backend/src/index.ts` |
| 4 | Integrationstest Join-Duplikat | `backend/src/services/sessionService.test.ts` (neu) |

### Sprint 23.3 — Prozess-Sicherheit & Singleplayer-Token

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Graceful Shutdown: `SIGTERM`/`SIGINT` → `prisma.$disconnect()` | `backend/src/index.ts` |
| 2 | Optional Singleplayer-Secret: `createRun` generiert Token, `assertRunPlayerAccess` prüft immer wenn Token existiert | `backend/src/services/createRun.ts`, `runPlayerAuth.ts`, `frontend/lib/api.ts` |
| 3 | Migration bestehender Solo-Runs: rückwärtskompatibel (Runs ohne Player-Zeile unverändert) | — |
| 4 | `helmet` für Basis-Security-Headers (API) | `backend/src/index.ts` |

### Abnahme M23

- [x] `POST /stats/pairings/reset` ohne `X-Admin-Key` → **401/403**
- [x] `POST /stats/pairings/baseline` ohne Key → **401/403**
- [x] Mit gültigem Key funktionieren Reset und Baseline wie bisher
- [x] Rate-Limit: >30 Requests/min auf `/sessions` → **429**
- [x] Gleiche `playerId` zweiter Join → **409** mit deutscher Meldung
- [x] `npm test` im Backend grün
- [x] Nutzer: Backend-Deploy + `ADMIN_API_KEY` / `NEXT_PUBLIC_ADMIN_API_KEY` gesetzt
- [x] `CHANGELOG.md` Eintrag

**Status:** **abgenommen** 2026-06-11 · Produktcode `cce4996` · Admin-Key per Env, kein UI-Prompt.

**Neuer Agent:** vor M24 (siehe Agent-Start M24).

---

## Agent-Start M24 (Übergabe an neuen Agent)

```text
Du arbeitest an dice.budget (kniffel).

Pflicht-Lesereihenfolge:
1. AGENT_RULES.md
2. HANDOVER.md
3. docs/milestone-roadmap-analysis.md — Abschnitt „M24 — UX-Blocker & Deploy-Verifikation“

Kontext:
- Branch milestone-22-prep, HEAD cce4996
- M23 (Sicherheit & API-Härtung) ist abgenommen: Admin-Auth Stats, Rate-Limits, Join-Duplikat, Solo-Secret, helmet, Graceful Shutdown
- ADMIN_API_KEY und NEXT_PUBLIC_ADMIN_API_KEY sind auf dem Server gesetzt und deployed

Auftrag:
- Umsetze Milestone M24 gemäß Roadmap (Sprints 24.1–24.3), sofern der Nutzer GO M24 gibt
- Sprint 24.1 zuerst: Pool-Endspiel Auto-Refresh für Nicht-Sieger in PlayBoard.tsx (ereignisbasiert, kein Polling/setInterval)
- AGENT_RULES: keine Dauerprozesse, nach Änderungen [Server]/[Mac]-Befehle, keine Commits ohne ausdrückliches GO
- docs/milestones_active.md nur bei Bedarf

Offen aus Nutzer-Diskussion (nicht Teil M24): Web-Zugang nach App-Store-Release deaktivieren — späterer Milestone.
```

---

## M24 — UX-Blocker & Deploy-Verifikation

**Status:** **abgenommen** 2026-06-11 · ereignisbasiertes Pool-Endspiel-Refresh, a11y-Basis, `verify-prod-api.sh`

### Abnahme M24

- [x] Multi Pool-Endspiel: Nicht-Sieger sieht Stats-Toggle **ohne** manuelles Aktualisieren (oder nach max. 1 Focus-Event)
- [x] `GET .../match-analysis` enthält `scoreProgression` und `coaching` (Backend deployed — Verifikation via Skript)
- [x] Zoom in Settings/Datenschutz funktioniert
- [x] Safari Hard-Reload zeigt aktuelle UI nach Frontend-Build (nginx no-cache konfiguriert)
- [ ] Nutzer: nginx reload falls noch nicht (`sudo nginx -t && sudo systemctl reload nginx`)
- [ ] TestFlight-Regression Pool-Endspiel auf Gerät

**Neuer Agent:** nach Abnahme M24 (Nutzer-Tests) → **M25**.

### Sprint 24.1 — Pool-Endspiel Auto-Refresh (Nicht-Sieger)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Beim Öffnen Abschluss-Screen / Focus / `visibilitychange`: gezielter Session-Reload wenn Pool-Endspiel aktiv und eigener Run fertig, aber Session noch nicht | `frontend/components/PlayBoard.tsx` |
| 2 | Kein `setInterval`/Polling — nur ereignisbasiert (AGENT_RULES) | — |
| 3 | Loading-State dezent („Session wird aktualisiert…") | `PlayBoard.tsx`, `globals.css` |
| 4 | Manueller „Aktualisieren"-Button bleibt als Fallback | — |

### Sprint 24.2 — Barrierefreiheit Basis

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `userScalable: false` / `maximumScale: 1` entfernen oder nur auf `/play` belassen, Settings/Legal zoombar | `app/layout.tsx`, Play-/App-Layouts |
| 2 | Skip-Link „Zum Inhalt" auf Home und Settings | `HomeScreenShell.tsx`, `FixedScreenShell.tsx` |
| 3 | Fokus-Falle in `PoolEndgamePanel` und `AchievementOverlay` prüfen/verbessern | jeweilige Komponenten |
| 4 | `prefers-reduced-motion` für neue Animationen verifizieren | — |

### Sprint 24.3 — Deploy-Verifikation & Cache

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Checkliste: Backend liefert `coaching` + `scoreProgression` in Match-Analyse | manuell / ein `curl` |
| 2 | Migration `extra_yatzy_die_values` auf Prod verifiziert | `prisma migrate status` |
| 3 | Dokumentation nginx reload für Cache-Header | `HANDOVER.md`, ggf. `infra/scripts/` Hinweis |
| 4 | Verifikations-Skript **einmalig** (kein Loop): `infra/scripts/verify-prod-api.sh` | neu, optional |

---

## M25 — Backend-Performance

**Status:** **abgenommen** 2026-06-11 · ein Query getRunById, createMany, DB-Aggregation, Pairing-Cache

**Ziel:** Read/Write-Pfade und Aggregationen für wachsende Nutzung optimieren.

### Sprint 25.1 — getRunById & Backfill

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Backfill `scoredSequence` einmalig per Migrations-Skript, nicht bei jedem Read | `backend/scripts/backfill-scored-sequences.ts`, Migration oder Script |
| 2 | `getRunById`: ein Query, kein doppeltes `findUnique` | `backend/src/services/getRun.ts` |
| 3 | Flag oder Check: Backfill nur wenn Felder ohne `scoredSequence` | `scoredSequence.ts` |

### Sprint 25.2 — instantiateRun & Indizes

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Field-Inserts via `createMany` pro Game | `backend/src/services/createRun.ts` |
| 2 | Prisma-Indizes: `Run.status`, `GameSession.pointsAwarded` | `prisma/schema.prisma` + Migration |
| 3 | Integrationstest Run-Erstellung Performance (optional Timing-Assert) | `createRun.test.ts` |

### Sprint 25.3 — Stats-Aggregation & Cache

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `getStats()` mit `aggregate` statt `findMany` aller Runs | `backend/src/services/getStats.ts` |
| 2 | `pairingStats`: In-Memory-Cache TTL 60s (invalidieren bei reset/baseline) | `backend/src/services/pairingStats.ts` |
| 3 | Tests für Cache-Invalidierung | `pairingStats.test.ts` |

### Abnahme M25

- [x] `getRunById` löst bei normalen Reads **keine** Schreiboperation aus
- [x] Run-Erstellung: `createMany` pro Spiel (13 Felder → 1 Insert)
- [x] `/stats` per `aggregate`/`groupBy`; `/stats/pairings` mit 60s-Cache
- [x] `npm test` grün (68 Tests)
- [ ] Nutzer: Backend-Deploy + `npx prisma migrate deploy` + optional `npm run db:backfill-scored-sequences`

**Neuer Agent:** nach Nutzer-Deploy → M26.

---

## M26 — Backend-Qualität & Tests

**Status:** **abgenommen** 2026-06-11 · OpenAPI, Supertest, sortFields, ABANDONED, player-names API

**Ziel:** Wartbarkeit, API-Dokumentation, Testabdeckung erweitern.

### Sprint 26.1 — Code-Konsolidierung

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `sortFields()` zentral in `domain/fieldTypes.ts` | Domain + Aufrufer in `getRun.ts`, `matchAnalysisService.ts`, `scoredSequence.ts` |
| 2 | `assertYatzyDieValue` → typisierter Error statt `new Error()` | `playField.ts`, `errorHandler.ts` |
| 3 | `abandonRun`: Status `ABANDONED` (Schema-Migration) oder dokumentierte Semantik `FINISHED` + Flag | `schema.prisma`, `abandonRun` Service |
| 4 | `playerNames`: entweder `GET/POST /player-names/aliases` oder Code entfernen | `routes/`, `playerNames.ts` |

### Sprint 26.2 — Route-Tests (Supertest)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Supertest-Setup mit Test-DB | `backend/src/test/httpSetup.ts` |
| 2 | Tests: Auth-Flow Multi (`X-Player-Secret`), 403/404/409 Pfade | `routes/runs.test.ts`, `routes/sessions.test.ts` |
| 3 | Tests: Stats-Admin-Auth (aus M23) | `routes/stats.test.ts` |
| 4 | `npm test` inkl. HTTP-Tests in CI-tauglich | `package.json` |

### Sprint 26.3 — OpenAPI & Linting

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | OpenAPI 3.0 Spec `backend/openapi.yaml` (alle Endpunkte) | neu |
| 2 | ESLint + Prettier Backend minimal | `eslint.config.js`, `package.json` |
| 3 | `backend/README.md` mit Start, Test, Deploy-Verweis | neu |

### Abnahme M26

- [x] `npm test` inkl. Route-Tests grün (76 Tests)
- [x] `openapi.yaml` deckt alle dokumentierten Endpunkte ab
- [x] Keine duplizierte `sortFields`-Implementierung
- [x] `playerNames` als API `/player-names/aliases` (GET/POST/DELETE)
- [ ] Nutzer: Backend-Deploy

**Neuer Agent:** nach Nutzer-Deploy → M27.

---

## M27 — Frontend-Tests & Stabilität

**Ziel:** Mindest-Sicherheitsnetz vor App-Store-Release.

### Sprint 27.1 — Playwright Smoke-Tests

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Playwright Setup, baseURL localhost:3021 | `frontend/playwright.config.ts`, `package.json` |
| 2 | Smoke: Solo starten → Feld antippen → Overlay sichtbar | `e2e/solo.spec.ts` |
| 3 | Smoke: Multi-Join-Seite lädt, Code-Eingabe | `e2e/multi-join.spec.ts` |
| 4 | Smoke: Startscreen `/app` rendert Cinematic oder Classic | `e2e/home.spec.ts` |
| 5 | README: `npm run test:e2e` (manuell, kein CI-Watcher auf Server) | `frontend/README.md` |

### Sprint 27.2 — Error Boundaries

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `AppErrorBoundary` für `/app`, `/play`, `/stats` Layouts | `components/AppErrorBoundary.tsx` |
| 2 | Freundliche Fallback-UI + Link Startseite | — |
| 3 | Optional: Error-Reporting Hook (nur `console`, kein externes Polling) | — |

### Sprint 27.3 — Unit-Tests kritische Libs

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Vitest oder Node test runner für Frontend | `package.json` |
| 2 | Tests: `gameScoring.ts` (upperBonusDelta, ergebnisOben) | `lib/gameScoring.test.ts` |
| 3 | Tests: `pairingMerge.ts`, `localSoloRun.ts` | jeweilige `.test.ts` |
| 4 | `npm run test` Frontend | — |

### Abnahme M27

- [ ] `npm run test:e2e` lokal grün (Nutzer oder Agent einmalig)
- [ ] `npm run test` Frontend grün
- [ ] Simulierter Render-Fehler zeigt Boundary, kein weißer Screen
- [ ] Kein Dauerprozess auf Server für Tests

**Neuer Agent:** nach M27 — **empfohlener Checkpoint vor App Store (M30)**.

---

## M28 — Frontend-Architektur & Bundle

**Ziel:** Monolithen abbauen, Ladezeit verbessern. **Kann nach Release** erfolgen.

### Sprint 28.1 — CSS-Modularisierung (Phase 1)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `globals.css` → `styles/base.css`, `styles/home-cinematic.css`, `styles/play.css` | `app/globals.css` importiert Module |
| 2 | Visueller Regression-Check: Home, Play, Stats | manuell / Screenshots |
| 3 | Keine Änderung an Klassennamen (nur Dateiaufteilung) | — |

### Sprint 28.2 — Code-Splitting

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `dynamic()` für `MatchAnalysisView`, `AchievementOverlay`, `ScoreProgressionChart` | Aufrufer in `PlayBoard`, `RunFinishScreen` |
| 2 | Bundle-Report vorher/nachher dokumentieren | `docs/` oder CHANGELOG |
| 3 | `@next/bundle-analyzer` einmalig | `package.json` devDep |

### Sprint 28.3 — PlayBoard-Refactor

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Hook `usePoolEndgameState` extrahieren | `lib/hooks/usePoolEndgameState.ts` |
| 2 | Hook `useFeedbackOverlayQueue` extrahieren | `lib/hooks/useFeedbackOverlayQueue.ts` |
| 3 | `PlayBoard.tsx` Ziel: <500 Zeilen Kern-JSX | `PlayBoard.tsx` |
| 4 | Verhalten identisch (kein Feature-Change) | — |

### Abnahme M28

- [ ] `/play` JS-Chunk messbar kleiner (Zahl in CHANGELOG)
- [ ] Keine sichtbaren UI-Regressionen auf iPhone + iPad
- [ ] `npm run build` erfolgreich
- [ ] TestFlight-Build mit refactored PlayBoard (Nutzer Mac)

**Neuer Agent:** pro Sprint 28.x (große Refactors).

---

## M29 — Technische Schulden & Security-Patch

**Ziel:** Verbleibende Schulden aus Analyse und `milestones_active.md`.

### Sprint 29.1 — LeagueStanding & Stats-Konsistenz

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Nach `resetPairings`: `LeagueStanding` neu berechnen oder Sessions markieren + UI-Hinweis | `pairingStats.ts`, `prisma` |
| 2 | Stats-Reset: nur ausgewählte Paarungen (optional, wenn in M23 nicht gelöst) | `resetPairings` Filter |
| 3 | Tests für Standing-Neuberechnung | — |

### Sprint 29.2 — Match-Analyse Zugriff

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `GET .../match-analysis`: optional `X-Player-Secret` des Viewers verlangen | `sessions.ts`, `matchAnalysisService.ts` |
| 2 | Frontend sendet Secret wenn vorhanden | `api.ts` |
| 3 | Rückwärtskompatibel: ohne Secret nur wenn Session `FINISHED` (Entscheidung dokumentieren) | `decisions.md` |

### Sprint 29.3 — Dependency-Security

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `npm audit` Frontend + Backend, sichere Updates | `package.json` lockfiles |
| 2 | Next.js Security-Upgrade prüfen (in milestones als später notiert) | `frontend/package.json` |
| 3 | Ergebnis in CHANGELOG | — |

### Abnahme M29

- [ ] Stats-Reset: dokumentiertes Verhalten für Liga-Punkte
- [ ] Match-Analyse: unberechtigter Zugriff eingeschränkt
- [ ] `npm audit` ohne kritische offene Findings (oder dokumentierte Ausnahmen)
- [ ] Backend-Deploy + Frontend-Build

**Neuer Agent:** nach M29, vor M30.

---

## M30 — App Store Release (organisatorisch)

**Ziel:** Kostenpflichtige Veröffentlichung im Apple App Store. **Nutzer-lastig**, Agent unterstützt bei Metadaten-Vorlagen und Regression.

### Sprint 30.1 — TestFlight-Regression (final)

| # | Aufgabe | Verantwortlich |
|---|---------|----------------|
| 1 | Checkliste aus `docs/ios_current.md` Build 28+ vollständig | Nutzer |
| 2 | Cinematic Startscreen, Footer/Menü, `/play`, Pool-Endspiel, Fortschritt, Code teilen | Nutzer |
| 3 | Punkte-Duell-Graph in Spielanalyse (nach M24 Backend) | Nutzer |
| 4 | Teilen Spielende + Bilanz | Nutzer |
| 5 | iPad-Tischmodus Stichprobe | Nutzer |
| 6 | Agent: Regression-Protokoll-Vorlage in `docs/ios_current.md` ergänzen | Agent (auf GO) |

### Sprint 30.2 — App Store Connect Vorbereitung

| # | Aufgabe | Verantwortlich |
|---|---------|----------------|
| 1 | Paid Applications Agreement aktivieren | Nutzer |
| 2 | Bank- und Steuerinformationen | Nutzer |
| 3 | Preis **1,19 EUR** (Tier) | Nutzer |
| 4 | Screenshots: 6,7" + 6,1" (mindestens) | Nutzer |
| 5 | Beschreibung DE, Keywords, Support-URL, Datenschutz-URL | Nutzer + Agent-Entwurf |
| 6 | Datenschutzfragebogen (App Privacy) | Nutzer |
| 7 | Build aus TestFlight für Review auswählen | Nutzer |

### Sprint 30.3 — Submit & Review

| # | Aufgabe | Verantwortlich |
|---|---------|----------------|
| 1 | `npm run build:ios` auf aktuellem HEAD | Nutzer Mac |
| 2 | Archive + Upload finale Build-Nummer | Nutzer |
| 3 | Submit for Review | Nutzer |
| 4 | Review-Feedback bearbeiten | Nutzer + Agent bei Code-Fixes |
| 5 | Release manuell oder automatisch nach Approval | Nutzer |
| 6 | `milestone-22-prep` → `main` Merge (nach Nutzer-Freigabe) | Nutzer + Agent |

### Abnahme M30 (Release)

- [ ] App Status in App Store Connect: **Ready for Sale** oder **Pending Developer Release**
- [ ] Web und iOS auf gleichem Produktcode-HEAD
- [ ] `HANDOVER.md` auf Release-Stand
- [ ] `docs/milestones_active.md`: Milestone 21 → abgeschlossen

**Neuer Agent:** nur bei Review-Ablehnung (Bugfix-Milestone), sonst Post-Release M31.

---

## M31 — Post-Release v1.1 — Plattform-Erweiterung

**Ziel:** Reichweite und Komfort nach erstem Store-Release.

### Sprint 31.1 — Service Worker (Offline-Assets)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | SW cached `/_next/static/`, Manifest, Home-Shell | `public/sw.js`, Registration in Layout |
| 2 | Kein API-Cache, kein Polling | AGENT_RULES |
| 3 | Update-Hinweis bei neuer SW-Version | kleine UI-Komponente |

### Sprint 31.2 — Universal Links & Deep Join

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Apple Associated Domains `applinks:dicebudget.bottle-trade.de` | iOS Projekt, `apple-app-site-association` |
| 2 | `/multi/join?code=XYZ` öffnet App | `multi/join/page.tsx`, Nginx |
| 3 | Fallback Web wenn App nicht installiert | — |

### Sprint 31.3 — Android (Capacitor)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `npx cap add android`, Gradle-Setup | `frontend/android/` |
| 2 | Icons, Splash, `build.gradle` | — |
| 3 | `npm run build:android` Skript | `package.json` |
| 4 | Play Store Vorbereitung (separater GO) | Doku |

### Abnahme M31

- [ ] Offline: Startscreen lädt ohne Netz (nach erstem Besuch)
- [ ] Universal Link öffnet Join auf iOS-Gerät mit installierter App
- [ ] Android APK/AAB baut lokal auf Mac/Nutzer-Rechner

**Neuer Agent:** pro Sprint 31.x.

---

## M32 — DevOps & Betrieb

**Ziel:** Wiederholbare Builds und sicherer Betrieb.

### Sprint 32.1 — CI-Pipeline (GitHub Actions)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Workflow: `backend` test + build | `.github/workflows/ci.yml` |
| 2 | Workflow: `frontend` lint + build + test | — |
| 3 | Kein Auto-Deploy auf Server (AGENT_RULES) | — |
| 4 | Kein Scheduled/Cron-Polling | — |

### Sprint 32.2 — Fastlane-Skeleton (Mac)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `fastlane/Fastfile`: lane `beta` (build:ios + upload) | `frontend/ios/` |
| 2 | Dokumentation in `docs/ios_current.md` | — |
| 3 | Secrets nur lokal/ASC API Key (nicht ins Repo) | — |

### Sprint 32.3 — Admin-UI Paarungs-Baselines

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | Settings-Bereich „Statistik-Verwaltung" (mit Admin-Key) | `app/settings/stats-admin/` |
| 2 | Reset und Baseline ohne direkte API-Keys im Quellcode hardcoded | Env |
| 3 | Bestätigungsdialoge für destruktive Aktionen | — |

### Abnahme M32

- [ ] GitHub Actions grün auf `milestone-22-prep` / `main`
- [ ] Fastlane-Doku vollständig (Upload optional Nutzer-Test)
- [ ] Stats-Admin-UI funktioniert mit M23-Auth

---

## M33 — Produkt v1.2 — Komfort & Internationalisierung

**Ziel:** Optionale Produktverbesserungen. **Je Sprint eigenes GO** (Scope groß).

### Sprint 33.1 — Push-Benachrichtigungen (Konzept)

| # | Aufgabe | Hinweis |
|---|---------|---------|
| 1 | Konzept: „Gegner ist dran" / „Raum voll" — **ohne Polling** | FCM + Server-Trigger bei Join/Finish |
| 2 | Nutzer-GO für Architektur vor Implementierung | `decisions.md` |
| 3 | Capacitor Push Plugin | nur nach GO |

### Sprint 33.2 — Lichtmodus

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | CSS-Variablen Theme light/dark | `globals.css` / Module |
| 2 | Toggle in Settings, `prefers-color-scheme` Default | `uiPrefs.ts` |
| 3 | Alle Screens regression-testen | — |

### Sprint 33.3 — i18n Grundlagen

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `next-intl` oder leichtes JSON-Label-System | `lib/labels.ts` erweitern |
| 2 | EN als zweite Sprache (minimal: Home, Play, Settings) | — |
| 3 | App Store EN-Metadaten parallel | Nutzer |

### Abnahme M33

- [ ] Pro Sprint: eigenes Abnahme-Kriterium vom Nutzer definiert
- [ ] Push nur live wenn Abuse-Konzept dokumentiert

---

## M34 — Skalierung (nur bei Bedarf)

**Ziel:** Wenn Nutzerzahl über Familie/Freunde hinauswächst. **Explizites GO nötig.**

### Sprint 34.1 — PostgreSQL-Evaluierung

| # | Aufgabe |
|---|---------|
| 1 | Migrationsplan SQLite → PostgreSQL |
| 2 | Prisma Provider Switch, Connection Pooling |
| 3 | Backup-Strategie |

### Sprint 34.2 — Echtzeit-Sync (optional)

| # | Aufgabe |
|---|---------|
| 1 | SSE oder WebSockets für Lobby-Updates — **nur mit GO** |
| 2 | Kein Ersatz für AGENT_RULES Polling-Verbot ohne Server-Konzept |
| 3 | Lasttests nur manuell, einmalig |

### Abnahme M34

- [ ] Nutzer-GO für Produktions-Migration
- [ ] Rollback-Plan dokumentiert

---

## Mapping: Analyse-Anmerkung → Milestone

| Analyse-Punkt | Milestone |
|---------------|-----------|
| Admin-Auth Stats reset/baseline | M23.1 |
| Rate-Limiting | M23.2 |
| Join-Duplikat | M23.2 |
| Body-Size-Limit, Helmet | M23.2, M23.3 |
| Graceful Shutdown | M23.3 |
| Singleplayer-Token | M23.3 |
| Pool-Endspiel Auto-Refresh | M24.1 |
| Zoom/a11y | M24.2 |
| Backend Deploy Coaching/scoreProgression | M24.3 |
| nginx Cache reload | M24.3 |
| getRunById Backfill | M25.1 |
| createMany Fields | M25.2 |
| DB-Indizes | M25.2 |
| getStats aggregate | M25.3 |
| pairingStats Cache | M25.3 |
| sortFields DRY | M26.1 |
| playerNames API/entfernen | M26.1 |
| abandonRun Status | M26.1 |
| Route-Tests Supertest | M26.2 |
| OpenAPI | M26.3 |
| ESLint Backend | M26.3 |
| Playwright E2E | M27.1 |
| Error Boundary | M27.2 |
| Frontend Unit-Tests | M27.3 |
| globals.css Split | M28.1 |
| dynamic() Code-Split | M28.2 |
| PlayBoard Hooks | M28.3 |
| bundle-analyzer | M28.2 |
| LeagueStanding Reset | M29.1 |
| Match-Analyse Token | M29.2 |
| Next.js Security-Upgrade | M29.3 |
| TestFlight Regression | M30.1 |
| App Store Connect | M30.2 |
| Submit Review | M30.3 |
| Service Worker | M31.1 |
| Universal Links | M31.2 |
| Android | M31.3 |
| CI GitHub Actions | M32.1 |
| Fastlane | M32.2 |
| Admin-UI Baselines | M32.3 |
| Push (ohne Polling) | M33.1 |
| Lichtmodus | M33.2 |
| i18n | M33.3 |
| PostgreSQL | M34.1 |
| WebSockets/SSE | M34.2 |
| Match-Analyse ohne Token (Risiko) | M29.2 |
| Keine Frontend-Tests | M27 |
| PlayBoard Monolith | M28.3 |
| Web ≠ iOS Workflow | M30 (Doku), fortlaufend AGENT_RULES |
| Safari Cache | M24.3 |
| Prettier Frontend | M28 oder M32 |
| E2E iPad-Tischmodus | M27.1 erweitern |
| Admin-UI manual baselines (tech debt) | M32.3 |

---

## Empfohlener Zeitplan

```
Woche 1 (Jun 11–17):  M23 → M24           [Agent + Nutzer Deploy]
Woche 2 (Jun 18–24):  M25 → M26 → M27     [Agent, parallel M25/M26 möglich]
Woche 3 (Jun 25–Jul 1): M29 → M30.1–30.2 [Nutzer ASC + Agent Doku]
Woche 4 (Jul 2–8):    M30.3 Apple Review  [Nutzer]
Ab Jul 2026:          M28, M31–M34 nach Priorität
```

---

## GO-Workflow für den Nutzer

Für jeden Milestone:

1. **„GO M23"** (oder „GO M23 Sprint 23.1") schreiben
2. Agent setzt um, dokumentiert CHANGELOG
3. Agent liefert `[Server]`/`[Mac]`-Befehle
4. Nutzer prüft **Abnahme-Checkliste**
5. Nutzer schreibt **„Abnahme M23 OK"** oder listet Abweichungen
6. Nächster Milestone → **neuer Agent** empfohlen

---

## Nächster Schritt

Warte auf dein **GO M23** (gesamt) oder **GO M23 Sprint 23.1** (nur Admin-Auth), um mit der Umsetzung zu beginnen.
