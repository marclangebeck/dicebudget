# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `cb101f6` (Yatzy-Markierung + Zusatz-Yatzy mit Würfelwahl)  
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
| Produktcode | HEAD `cb101f6`; Frontend `out/` gebaut; **Backend-Deploy** für Zusatz-Yatzy-Migration + geänderten Endpunkt durch Nutzer (siehe unten) |
| Backend | Migrationen `20260605120000_pairing_stats_yatzy_die`, **`20260608120000_extra_yatzy_die_values`**; `finalize-stats`, `GET /sessions/invite/:code/match-analysis`; `POST /runs/:id/extra-yatzy` mit `{ yatzyDieValue }` |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (6)`, nächster Upload `2.0 (7)` |
| Noch nicht in iOS `2.0 (6)` | M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard + Footer/Legal + 3D-Icons + Spiel-UX Juni 2026 + Spielanalyse + **Yatzy-Miniwürfel / Zusatz-Yatzy-Würfelwahl** |

## Neu Seit Letzter Übergabe (2026-06-08)

- **Yatzy-Markierung auf dem Zettel:** Nach Yatzy (50 Punkte) erscheinen neben dem Feld-Würfel **Mini-Würfel** (50 % Höhe) mit der gewählten Augenzahl. Ab dem 6. Yatzy pro Augenzahl **Umbruch** (max. 5 pro Zeile), damit nichts in die Wertespalten ragt. `DiceFace` mit Größen `field` / `mini`.
- **Zusatz-Yatzy (+100):** Beim **+** neben „Yatzy“ Würfelwahl (1–6) vor dem Bonus; Augenzahl wird gespeichert und in der Markierung mitgezählt. Backend: `games.extra_yatzy_die_values` (JSON-Array, Migration `20260608120000`). API: `POST /runs/:id/extra-yatzy` erfordert `yatzyDieValue`. Solo lokal analog in `localSoloRun.ts`.
- **Zusatz-Yatzy-Auswahl sichtbar:** Popover per **Portal** (`ExtraYatzyPickerOverlay`) — Fix für Abschneiden durch `overflow: hidden` und `FitScoreSheet`-Skalierung.

## Bereits Vorher (Spielanalyse 2026-06-06, `d00059f`)

- Spielanalyse optional nach Multi/Solo-Abschluss und unter `/stats/pairing`; 2P Head-to-Head, 3–6P Ranking + Direktvergleiche, Solo lokal.
- Multi `maxPlayers` Default 2, Cap 2–6; kein Wartesaal.

## Bereits Vorher (Spiel-UX Juni 2026)

- Werten/Nicht werten, Yatzy-Würfel-Abfrage beim Eintrag, dunkle Ergebniszeilen, Settings-Gruppen, Toggles `.app-toggle`, Start-Icons +75 %.
- Fix `finalize-stats`: Einzelspieler-Multi-Räume, 409 statt 500 bei Blockade.

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **iPad-Tischmodus:** Spielanalyse am Finish-Flow noch nicht in `TableModePlayBoard` eingebunden.

## Wichtige Dateien

- `frontend/components/ScoreSheetTable.tsx`, `DiceFace.tsx`, `YatzyDiePicker.tsx`, `ExtraYatzyPickerOverlay.tsx`
- `frontend/components/ScoreEntryPanel.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`
- `frontend/lib/localSoloRun.ts`, `frontend/lib/api.ts`
- `backend/src/services/playField.ts`, `backend/src/routes/runs.ts`, `backend/src/domain/extraYatzyDieValues.ts`
- `backend/prisma/migrations/20260608120000_extra_yatzy_die_values/`
- `frontend/components/MatchAnalysisView.tsx` — Spielanalyse
- `backend/src/domain/matchAnalysis.ts`, `backend/src/services/matchAnalysisService.ts`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Backend deployen** (Migration `extra_yatzy_die_values` + geänderter `extra-yatzy`-Endpunkt): Nutzer per SSH `sudo bash …/deploy-backend-prod.sh`.
2. iOS-Build `2.0 (7)` auf dem Mac (alles seit `2.0 (6)` inkl. Spielanalyse + Yatzy-UX).
3. TestFlight: Yatzy-Markierung, Zusatz-Yatzy-Würfelwahl, Spielanalyse, Multi-Abschluss, Pool-Endspiel, Footer/`/play`.
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
- Produktcode-HEAD: cb101f6 (Yatzy-Miniwürfel, Zusatz-Yatzy mit Würfelwahl, Portal-Popover)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), nächster Upload 2.0 (7)
- Backend: finalize-stats; GET /sessions/invite/:code/match-analysis; POST /runs/:id/extra-yatzy mit yatzyDieValue; Migration extra_yatzy_die_values
- Yatzy: Mini-Würfel neben Feld-Würfeln (50% Höhe), max. 5 pro Zeile dann Umbruch; + bei Yatzy mit Würfelwahl (+100)
- Spielanalyse: optional nach Spielende und unter /stats/pairing; 2P/3–6P/Solo
- Multi maxPlayers: Default 2, Cap 2–6; kein Wartesaal; Werten/Nicht werten
- Pool-Endspiel: Nicht-Sieger ggf. Aktualisieren nötig (bekanntes UX-Thema)
- Backend-Neustart (bei Backend-Änderung / Migration): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
