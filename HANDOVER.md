# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `f5a2665` (Hausregeln auto/Toggles/Info, Fortschritt-Delta, Statistik lokal löschen, Feldeintrag schneller)  
**Sprache:** Deutsch  
**Stand Doku:** 2026-07-31

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md` (**M30** App Store Release). Aktiver Milestone-Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung (**GO**).
- Kein `sudo` durch den Agent; Backend-Deploy per Nutzer auf dem Server.
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel`.
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` @ `f5a2665` |
| Roadmap | **M30** App Store Release als Nächstes |
| Frontend-Tests | **55** Unit-Tests (`frontend`: `npm test`) |
| Backend-Tests | 83/86 grün lokal; **3 Failures** erwartbar: Baseline/Reset-Admin-Auth-Tests noch auf altem „Admin-Key Pflicht“ (Baseline ist absichtlich ohne Key) — Suite bei nächstem Stats-Auth-Touch anpassen |
| Entwickler-Vorschau | Hausregeln auf `/settings` nach Code (`NEXT_PUBLIC_LABS_PIN`) |
| iOS/TestFlight | Version `2.0`; **Build `2.0 (28)`** in Connect; **nächster Upload `2.0 (29)`** auf HEAD `f5a2665` (noch offen) |
| Backend Prod | Migration `20260725120000_house_rule_toggles_and_triple` + Code ab `7ed6cb9`/`f5a2665` — **Deploy prüfen**, falls Auto-Regeln/Lite-Lobby/Performance live fehlen |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle und öffnet Xcode.
- Vor Archive: `git log -1`; `NEXT_PUBLIC_LABS_PIN` und `NEXT_PUBLIC_ADMIN_API_KEY` in `frontend/.env.production` setzen.

## Letzte Produktänderungen (2026-07, HEAD `f5a2665`)

### Hausregeln (Strategy, Duell / Labor)

| Regel | Verhalten | Steuerung |
|-------|-----------|-----------|
| **Brennt** | −1 Pool, neu würfeln | Labs-Toggle |
| **Wurf verkaufen** | Volle Feldzeile → Pool-Transfer + Freifeld | Labs-Toggle |
| **2× Alle Fünfe** | ≤3 Würfe, 2× hintereinander → Gegner-Pool **halbiert** (Duell auto + Overlay) | Labs + Session-Flag `ruleYatzyStreak2` |
| **3× Alle Fünfe** | ≤3 Würfe, 3× hintereinander → Gegner-Pool **0** (Duell auto + Overlay; Vorrang vor 2×) | Labs + Session-Flag `ruleYatzyTriple` |
| **Oberer Bereich zuerst** | Alle oberen Felder (Spiele × 6) voll → Pool = offene obere Felder des Rivalen | Labs + Session-Flag `ruleUpperRace` |

- Info-**„i“** an jeder Hausregel und unter **Visuelle Einblendungen**.
- Host-Toggles werden beim Raum-Erstellen als Session-Flags übernommen (`sessionHouseRuleFlagsFromPrefs`).
- Domäne: `backend/src/domain/houseRules.ts`, Service: `houseRulesService.ts` → `applyAutoHouseRulesAfterComplete`.
- Overlays: `RuleEventOverlay.tsx`, `ruleEventFeedback.ts`, Queue in `feedbackOverlayQueue.ts`.

### Fortschritt 25 / 50 / 75 %

- Meilenstein = Anteil **eingetragener Felder**.
- Punktdifferenz = Summe **Feld-Scores** (`enteredDiceScore` / Lobby `diceScore`) — **ohne** oberen Bonus (+35) und **ohne** Extra-Yatzy.
- Dateien: `lib/runProgressFeedback.ts`, Lobby `diceScore` in `sessionService.ts`.

### Statistik

- Fremde Paarungen: Filter über eigene ID / Alias / **„Das bin ich“** (`selfIdentity.ts`, Rivalen-UI).
- **Paarungen löschen:** lokal ausblenden (`hiddenPairings.ts`) — Rivalen bleiben; wieder anzeigbar; auch Startscreen-Bilanz.
- Baseline bearbeiten: **ohne** Admin-API-Key (iOS ohne eingebetteten Key).
- Server-`resetPairings` (destruktiv, Admin) ist nicht mehr der Standard-UX-Pfad.

### Performance Feldeintrag (`f5a2665`)

- Parallel Auth+Feld-Load; Snapshot nur bei Auto-Regeln; Game-Updates parallel; weniger Run-Reloads.
- Complete-Antwort ohne Roll-Historie; Lobby mid-game `?lite=1` ohne Liga-Standings.
- Overlay vor Lobby-Refresh (Tischmodus); Finish-Lobby fire-and-forget.

## Prod-Verifikation & Deploy

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

**Backend-Deploy** (Migration + Restart):

```bash
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

Frontend: `cd frontend && npm run build` (Agent auf Server; `out/` live).

## Wichtige Dateien

- Hausregeln: `domain/houseRules.ts`, `houseRulesService.ts`, `featureFlags.ts`, `houseRuleInfo.ts`, `HouseRulesTableActions.tsx`, `HouseRuleInfoOverlay.tsx`
- Fortschritt: `runProgressFeedback.ts`, `RunProgressOverlay.tsx`
- Statistik: `app/stats/page.tsx`, `hiddenPairings.ts`, `selfIdentity.ts`, Rivalen `settings/rivals`
- Performance: `playField.ts`, `getRun.ts`, `sessionService.ts`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`
- iOS: `docs/ios_current.md`, `GOiOS.md`

## Offene Prioritäten

1. **M37–M41** spezifiziert (Wunschliste 2026-07-31) — Details Roadmap; **kein Code ohne GO** je Milestone. Empfohlen: M37 → M41 → M39 → M38 → M40 (nach Regel-OK).
2. **iOS Build `2.0 (29)`** — `git pull` → `npm run build:ios` → Archive → TestFlight (HEAD `f5a2665`).
3. **M30** TestFlight-Regression + App Store Connect.
4. `milestone-22-prep` → `main` nach Release-Freigabe.
5. Später **M36** (öffentliche Hausregeln / Session-UI) — Session-Flags teilweise schon da.
6. Backend Prod: Migration/`f5a2665` laut Verifikation bereits deployed (25.07.); bei Zweifel erneut deployen.

## Agent-Start (Übergabeprompt)

```text
Du arbeitest an dice.budget (kniffel). Lies zuerst AGENT_RULES.md und HANDOVER.md, dann docs/milestones_active.md.

Workspace: /home/bottleadmin/projects/kniffel
Branch: milestone-22-prep
HEAD: f5a2665
Live: https://dicebudget.bottle-trade.de
Sprache: Deutsch

Regeln: Keine Commits ohne ausdrückliches GO. Kein sudo. Keine Watcher/Polling/Dauerprozesse. Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle (AGENT_RULES §9). Frontend-Build auf dem Server: cd frontend && npm run build. Backend-Deploy nur Nutzer: sudo bash infra/scripts/deploy-backend-prod.sh.

Stand: Auto-Hausregeln (2×/3× Alle Fünfe, Oberer Bereich) mit Labs-Toggles, Session-Flags, Info-„i“, Fortschritts-Delta nur Feldpunkte, Statistik Paarungen lokal löschen + „Das bin ich“, Feldeintrag-Performance (lite Lobby, weniger Queries).

Offen: Backend-Prod-Deploy prüfen; iOS TestFlight Build 2.0 (29) auf f5a2665; M30 App Store.

Antworte auf Deutsch. Kleine Inkremente, vor größeren Features GO einholen.
```
