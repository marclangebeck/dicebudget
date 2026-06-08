# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `5f90ad8` (Erfolg teilen, Alle-Fünfe-Branding, Doku-Übergabe)  
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
| Produktcode | HEAD `5f90ad8`; Frontend `out/` gebaut; **Backend-Deploy** für Coaching-Texte + Fehlermeldungen durch Nutzer |
| Backend | `finalize-stats`, `GET /sessions/invite/:code/match-analysis` inkl. **`coaching`**; `POST /runs/:id/extra-yatzy` mit `{ yatzyDieValue }`; Migration `extra_yatzy_die_values` |
| UI-Branding | Nutzer-sichtbar **Alle Fünfe** statt „Yatzy“; technische IDs (`yatzyDieValue`, `extra-yatzy`, CSS `.play-yatzy-*`) unverändert |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (21)`, nächster Upload `2.0 (22)` |
| Noch nicht in iOS `2.0 (21)` | Alle-Fünfe-Miniwürfel, Zusatz-Alle-Fünfe-Würfelwahl, **Spiel-Feedback** (Gaming-Politur), **Erfolg teilen**, **Spielanalyse-Coaching**, Einstellungen-Rücknavigation (alles seit `48a65f1` / `3c03592` / `a93e462`) |

## Neu Seit Letzter Übergabe (2026-06-08)

### Erfolg teilen (Share)

- Screenshot-freundliche Share-Karte mit App-Branding (Canvas).
- Share-Leiste: WhatsApp, Instagram Story (Bild-Share), System-Teilen (`ShareActionBar`).
- Eingebunden auf: **Erfolgs-Overlays**, **Abschluss-Screen**, **Spielanalyse**, **Paarungs-Bilanz** (`/stats/pairing`), **Startscreen-Bilanz**, **iPad-Tischmodus-Duell** (inkl. Spielanalyse-Button im Tischmodus).
- Dateien: `frontend/lib/shareSocial.ts`, `shareCanvasUtils.ts`, `achievementShare.ts`, `matchResultShare.ts`, `ShareActionBar.tsx`, `AchievementShareBar.tsx`.

### Alle Fünfe (Markenwort „Yatzy“ entfernt)

- Zentral: `frontend/lib/labels.ts` → `KNIFFEL: "Alle Fünfe"`.
- UI: Zettelzeile, Eintrag, Zusatz-Bonus, Spiel-Feedback (`ALLE FÜNFE!`), Spielanalyse/Coaching, Datenschutz/Marketing, Fehlermeldungen.
- Technische Bezeichner bleiben (`yatzyDieValue`, API `extra-yatzy`, Achievement-Typ `"yatzy"`, CSS-Klassen).

### Spiel-Feedback Gaming-Politur (`a93e462`)

- Dunkle Gaming-Overlays (Glas-Karte, Gold-Kicker, typ-spezifische Szenen).
- Layered Web-Audio (Riser, Kicks, Stereo-Panning, Noise-Bursts).
- „Außerhalb tippen zum Schließen“.

## Bereits Vorher (Coaching + Basis-Feedback, `3c03592`)

- **Spielanalyse-Coaching:** Narrative, Stärken/Schwächen, Pool-Report, Feld-Differenzen, bis zu 3 Tipps; API-Feld `coaching` (Multi nach Backend-Deploy; Solo clientseitig).
- **Spiel-Feedback (Basis):** `AchievementOverlay` + Sound bei Bonus, unterer Spalte, Große Straße, Alle Fünfe.
- **Einstellungen-Rücknavigation:** `?from=solo|multi` → „Zurück zu Einzelspiel/Multiplayer“.

## Bereits Vorher (Alle-Fünfe-UX technisch, `cb101f6`)

- Mini-Würfel-Markierung (50 % Höhe), Umbruch ab 6. gleicher Augenzahl; Zusatz-Alle-Fünfe mit Würfelwahl (+100); Portal-Popover `ExtraYatzyPickerOverlay`.
- Migration `20260608120000_extra_yatzy_die_values`.

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **Multi-Coaching live:** Volles Coaching nach Multi-Spielende erst nach **Backend-Deploy** (`coaching` in API); Solo-Coaching läuft clientseitig sofort.

## Wichtige Dateien

- Share: `frontend/lib/shareSocial.ts`, `shareCanvasUtils.ts`, `achievementShare.ts`, `matchResultShare.ts`, `ShareActionBar.tsx`
- Labels/Branding: `frontend/lib/labels.ts`, `frontend/lib/achievementTypes.ts`
- Spiel-Feedback: `frontend/components/AchievementOverlay.tsx`, `frontend/lib/achievementSound.ts`, `frontend/app/globals.css`
- Analyse/Coaching: `frontend/components/MatchAnalysisView.tsx`, `frontend/lib/matchCoaching.ts`, `backend/src/domain/matchCoaching.ts`
- Zettel: `frontend/components/ScoreSheetTable.tsx`, `ExtraYatzyPickerOverlay.tsx`, `YatzyDiePicker.tsx`
- Abschluss/Play: `RunFinishScreen.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`, `HomeBentoGrid.tsx`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Backend deployen** (Coaching-API + Migration `extra_yatzy_die_values` + Alle-Fünfe-Fehlertexte): Nutzer per SSH `sudo bash …/deploy-backend-prod.sh`.
2. iOS-Build **`2.0 (22)`** auf dem Mac (alles seit `2.0 (21)`).
3. TestFlight: Share, Alle-Fünfe-Branding, Spiel-Feedback-Gaming, Coaching, Mini-Würfel, Einstellungen-Rücknavigation, Regression Footer/`/play`, Multi-Abschluss.
4. Optional: Pool-Endspiel Auto-Refresh.
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
- Produktcode: Share-Funktion, Alle-Fünfe-Branding (UI), Spiel-Feedback Gaming-Politur (a93e462), Coaching (3c03592); HEAD 5f90ad8
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (21), nächster Upload 2.0 (22)
- UI-Branding: Nutzer-sichtbar „Alle Fünfe“ statt Yatzy; technische IDs (yatzyDieValue, extra-yatzy) unverändert
- Erfolg teilen: Canvas-Karte + WhatsApp/Instagram/System auf Overlays, Abschluss, Analyse, Bilanz, Tischmodus-Duell
- Spiel-Feedback: dunkle Gaming-Overlays + Layered Web-Audio; Toggle „Spiel-Feedback“
- Spielanalyse-Coaching: Narrative, Stärken/Schwächen, Pool-Report, Tipps (Multi nach Backend-Deploy)
- Alle-Fünfe-UX: Mini-Würfel-Markierung, Zusatz-Alle-Fünfe-Würfelwahl (+100), Portal-Popover
- Einstellungen: ?from=solo|multi → Zurück zu Einzelspiel/Multiplayer
- Multi: maxPlayers Default 2, Cap 2–6; Werten/Nicht werten; Pool-Endspiel (Nicht-Sieger ggf. Aktualisieren)
- Backend-Neustart (bei Backend-Änderung): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
