# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `d00059f` (Spielanalyse Multi/Solo, Mehrspieler 3–6)  
**Sprache:** Deutsch

Diese Datei ist die kompakte Startübergabe. Aktiver Arbeitsstand: `docs/milestones_active.md`. iOS/App Store: `docs/ios_current.md`. Dauerhafte Projektentscheidungen nur bei Bedarf: `docs/decisions.md`.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9 ist Pflicht: Nach jeder Code-Änderung GitHub, Server und Mac synchronisieren und nummerierte `[Server]`-/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung.
- Kein `sudo` durch den Agent; sudo-Schritte sind immer Nutzer-Aufgabe **auf dem Server** (per SSH), nicht auf dem Mac.
- Keine Watcher, kein Polling, keine Dauerprozesse, kein Auto-Deploy.
- Agent arbeitet nur auf dem Server unter `/home/bottleadmin/projects/kniffel`.
- Mac-Pfad des Nutzers: `/Users/marclangebeck/projects/kniffel`.
- Reine Frontend-Änderungen: auf dem Server genügt `cd frontend && npm run build`; Nginx liefert `frontend/out/` direkt aus.
- Backend-Neustart/Migration: Nutzer per SSH auf dem Server mit `sudo bash …/deploy-backend-prod.sh` — **nicht** mit Mac-Pfad `/home/bottleadmin/…`.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Produktcode | HEAD `d00059f`; Frontend `out/` gebaut; **Backend-Neustart** für `match-analysis` ggf. noch durch Nutzer (siehe unten) |
| Backend | Migration `20260605120000_pairing_stats_yatzy_die`; `finalize-stats`, **`GET /sessions/invite/:code/match-analysis`** |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (6)`, nächster Upload `2.0 (7)` |
| Noch nicht in iOS `2.0 (6)` | M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard + Footer/Legal + 3D-Icons + Spiel-UX Juni 2026 + **Spielanalyse** |

## Neu Seit Letzter Übergabe (2026-06-06)

- **Spielanalyse (Head-to-Head / Session):** Nach Multi-Abschluss (nach Pool-Endspiel bzw. direkt ohne) optional Button **„Spielanalyse“** auf `RunFinishScreen` — aktiv, nicht automatisch. Abgeleitete Kennzahlen (Attribution, Pool-Effektivität, Yatzy, entscheidender Block/Feld), kein Zettel-Duplikat. **2 Spieler:** ein Head-to-Head. **3–6 Spieler:** Runden-Ranking, Direktvergleich vs. jeden Mitspieler, Platz/Abstand zur Spitze. **Solo:** eigene Analyse lokal. **Historie:** `/stats/pairing` → App-Runde antippen → `/stats/match-analysis?invite=…`. Backend: `backend/src/domain/matchAnalysis.ts`, `matchAnalysisService.ts`, Route in `sessions.ts`.
- **Multiplayer Spieleranzahl:** `maxPlayers` bleibt Host-Option (Default 2 in `/settings`); kein Wartesaal — wer Code hat, tritt bei. Session endet, wenn alle **beigetretenen** Runs fertig sind (nicht wenn `maxPlayers` erreicht).

## Bereits Vorher (Spiel-UX Juni 2026, in `d130be7` ff.)

- Werten/Nicht werten, Yatzy-Strichliste, dunkle Ergebniszeilen, Settings-Gruppen, Toggles `.app-toggle`, Start-Icons +75 %.
- Fix `finalize-stats`: Einzelspieler-Multi-Räume, 409 statt 500 bei Blockade.

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **iPad-Tischmodus:** Spielanalyse am Finish-Flow noch nicht in `TableModePlayBoard` eingebunden.

## Wichtige Dateien

- `frontend/components/MatchAnalysisView.tsx` — UI Spielanalyse
- `frontend/components/RunFinishScreen.tsx`, `PlayBoard.tsx` — Button „Spielanalyse“
- `frontend/app/stats/match-analysis/page.tsx`, `frontend/app/stats/pairing/page.tsx` — Historie
- `frontend/lib/matchAnalysis.ts`, `frontend/lib/matchAnalysisTypes.ts`
- `backend/src/domain/matchAnalysis.ts`, `backend/src/services/matchAnalysisService.ts`
- `backend/src/routes/sessions.ts` — `GET …/match-analysis`
- `frontend/components/StatsRatingToggle.tsx`, `sessionService.ts` — Werten/Nicht werten
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Backend deployen** (falls `match-analysis` live noch 404): Nutzer per SSH `sudo bash …/deploy-backend-prod.sh`.
2. iOS-Build `2.0 (7)` auf dem Mac (enthält alles seit `2.0 (6)` inkl. Spielanalyse).
3. TestFlight: Spielanalyse 2P/3+P, Multi-Abschluss, Pool-Endspiel, Yatzy, Footer/`/play`.
4. Optional: Pool-Endspiel Auto-Refresh; Spielanalyse iPad-Tischmodus.
5. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.

## Pflicht-Lesereihenfolge

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md`

Nur bei Bedarf: `docs/ios_current.md`, `docs/decisions.md`, `docs/milestones_archive.md`, `docs/ios_archive.md`

## Übergabeprompt Für Neuen Agent

```text
Du arbeitest am Projekt dice.budget weiter (Repo: kniffel).

Antworten auf Deutsch. Keine Commits ohne explizite Nutzer-Anweisung.

LIES ZUERST in dieser Reihenfolge:
1. AGENT_RULES.md
2. HANDOVER.md
3. docs/milestones_active.md

LIES NUR BEI BEDARF:
4. docs/ios_current.md
5. docs/decisions.md
6. docs/milestones_archive.md
7. docs/ios_archive.md

Wichtige Regeln:
- AGENT_RULES.md hat Vorrang.
- AGENT_RULES.md Sektion 9: Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle ausgeben.
- Kein sudo durch den Agent; Backend-Deploy/Neustart per SSH auf dem Server (Nutzer-Aufgabe).
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet auf dem Server unter /home/bottleadmin/projects/kniffel.
- Mac-Clone: /Users/marclangebeck/projects/kniffel (git pull, Xcode/iOS).
- Reine Frontend-Änderungen: cd frontend && npm run build auf dem Server.

Aktueller Kurzstand:
- Branch: milestone-22-prep
- Produktcode-HEAD: d00059f (Spielanalyse Multi/Solo, Mehrspieler 3–6)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), nächster Upload 2.0 (7)
- Backend: finalize-stats; GET /sessions/invite/:code/match-analysis (Spielanalyse)
- Spielanalyse: optional nach Spielende (RunFinishScreen) und nachträglich unter /stats/pairing; 2P Head-to-Head, 3–6P Ranking + Direktvergleiche, Solo lokal
- Multi maxPlayers: Default 2 in Settings, Cap 2–6; wer Code hat spielt mit (kein Wartesaal)
- Multi-Statistik: Switch Werten/Nicht werten; finalize-stats beim Verlassen
- Yatzy-Strichliste, dunkle Ergebniszeilen, Settings-Gruppen, /play ohne Footer
- Pool-Endspiel: Nicht-Sieger ggf. Aktualisieren nötig (bekanntes UX-Thema)
- Backend-Neustart (nur bei Backend-Änderung / neuer Endpunkt): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
