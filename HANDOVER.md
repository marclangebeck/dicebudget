# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `3c03592` (Spielanalyse-Coaching + Spiel-Feedback + Einstellungen-Rücknavigation)  
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
- Backend-Neustart: Nutzer per SSH auf dem Server mit `sudo bash …/deploy-backend-prod.sh` — **nicht** mit Mac-Pfad `/home/bottleadmin/…`.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Produktcode | HEAD `3c03592`; Frontend `out/` gebaut; **Backend-Deploy** für Coaching-API + ggf. Yatzy-Migration durch Nutzer (siehe unten) |
| Backend | `finalize-stats`, `GET /sessions/invite/:code/match-analysis` inkl. **`coaching`**; `POST /runs/:id/extra-yatzy` mit `{ yatzyDieValue }`; Migration `extra_yatzy_die_values` |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (21)`, nächster Upload `2.0 (22)` |
| Noch nicht in iOS `2.0 (21)` | Yatzy-Miniwürfel, Zusatz-Yatzy-Würfelwahl, **Spiel-Feedback**, **Spielanalyse-Coaching**, Einstellungen-Rücknavigation (alles seit `48a65f1` / `3c03592`) |

## Neu Seit Letzter Übergabe (2026-06-08, `3c03592`)

- **Spielanalyse-Coaching (Multi + Solo):** Regelbasierte Auswertung — Narrative (Sieg/Niederlage/Platz), Stärken/Schwächen, Pool-Report (Strategy), Feld-Differenzen, bis zu 3 Tipps. Backend: `backend/src/domain/matchCoaching.ts`, Feld `coaching` in Match-Analysis-API. UI: `MatchAnalysisView` im dunklen App-Dashboard-Design (Sektionen Warum · Profil · Pool · Felder · Nächstes Mal · Details).
- **Spiel-Feedback:** `AchievementOverlay` bei Bonus, unterer Spalte voll, Große Straße, Yatzy — mit synthetisierten Web-Audio-Sounds. Toggle **„Spiel-Feedback“** in Einstellungen (ersetzt „Bonus-Einblendung“). Solo, Multi und iPad-Tischmodus.
- **Einstellungen-Rücknavigation:** Von `/solo` und `/multi` → `/settings?from=solo|multi` → „Zurück zu Einzelspiel/Multiplayer“.

## Bereits Vorher (Yatzy-UX, `cb101f6`)

- Yatzy-Miniwürfel (50 % Höhe), Umbruch ab 6. gleicher Augenzahl; Zusatz-Yatzy mit Würfelwahl (+100); Portal-Popover `ExtraYatzyPickerOverlay`.
- Migration `20260608120000_extra_yatzy_die_values`.

## Bereits Vorher (Spielanalyse Basis, `d00059f`)

- Optionale Analyse nach Spielende und unter `/stats/pairing`; 2P Head-to-Head, 3–6P Ranking + Direktvergleiche, Solo lokal.

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **iPad-Tischmodus:** Spielanalyse am Finish-Flow noch nicht in `TableModePlayBoard` eingebunden.
- **Multi-Coaching live:** Volles Coaching nach Multi-Spielende erst nach **Backend-Deploy** (`coaching` in API); Solo-Coaching läuft clientseitig sofort.

## Wichtige Dateien

- `frontend/components/MatchAnalysisView.tsx`, `frontend/lib/matchCoaching.ts`, `frontend/lib/matchAnalysisTypes.ts`
- `backend/src/domain/matchCoaching.ts`, `backend/src/domain/matchAnalysis.ts`
- `frontend/components/AchievementOverlay.tsx`, `frontend/lib/achievementFeedback.ts`, `frontend/lib/achievementSound.ts`
- `frontend/lib/settingsReturn.ts`, `frontend/app/settings/page.tsx`, `frontend/components/GameSetup.tsx`, `frontend/app/multi/page.tsx`
- `frontend/components/ScoreSheetTable.tsx`, `DiceFace.tsx`, `ExtraYatzyPickerOverlay.tsx`
- `frontend/components/PlayBoard.tsx`, `TableModePlayBoard.tsx`, `RunFinishScreen.tsx`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Backend deployen** (Coaching-API + ggf. Yatzy-Migration): Nutzer per SSH `sudo bash …/deploy-backend-prod.sh`.
2. iOS-Build **`2.0 (22)`** auf dem Mac (alles seit `2.0 (21)`).
3. TestFlight: Spiel-Feedback, Coaching-Analyse, Yatzy-Miniwürfel, Einstellungen-Rücknavigation, Regression Footer/`/play`, Multi-Abschluss.
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
- Produktcode-HEAD: 3c03592 (Spielanalyse-Coaching, Spiel-Feedback, Einstellungen-Rücknavigation)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (21), nächster Upload 2.0 (22)
- Spielanalyse-Coaching: Narrative, Stärken/Schwächen, Pool-Report, Tipps; API-Feld coaching (Multi nach Backend-Deploy; Solo clientseitig)
- Spiel-Feedback: AchievementOverlay + Sound bei Bonus, untere Spalte, Große Straße, Yatzy; Toggle Spiel-Feedback
- Yatzy: Mini-Würfel, Zusatz-Yatzy-Würfelwahl (+100), Portal-Popover
- Einstellungen: ?from=solo|multi → Zurück zu Einzelspiel/Multiplayer
- Multi: maxPlayers Default 2, Cap 2–6; Werten/Nicht werten; Pool-Endspiel (Nicht-Sieger ggf. Aktualisieren)
- Backend-Neustart (bei Backend-Änderung): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
