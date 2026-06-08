# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `de0f8f2`  
**Sprache:** Deutsch

Diese Datei ist die kompakte Startübergabe. Aktiver Arbeitsstand: `docs/milestones_active.md`. iOS/TestFlight/App Store: `docs/ios_current.md`. Dauerhafte Projektentscheidungen nur bei Bedarf: `docs/decisions.md`.

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
| Produktcode | HEAD `de0f8f2`; Frontend `out/` gebaut; **Backend-Deploy** für `scoreProgression` + Coaching-API + Migration `extra_yatzy_die_values` durch Nutzer |
| Backend | `GET …/match-analysis` inkl. **`coaching`** und **`scoreProgression`**; `scoredSequence` in Run-DTO; `POST /runs/:id/extra-yatzy` mit `{ yatzyDieValue }` |
| UI-Branding | Nutzer-sichtbar **Alle Fünfe** statt „Yatzy“; technische IDs unverändert |
| Teilen | **Nur** Spielende (`RunFinishScreen`) + Startscreen-Bilanz; ein **Teilen**-Button → System-Share (PNG) bzw. Download; **kein** Share in Erfolgs-Overlays/Spielanalyse |
| iOS/TestFlight | Version `2.0`, Build `2.0 (21)`, nächster Upload `2.0 (22)` |
| Noch nicht in iOS `2.0 (21)` | Alles seit `2.0 (21)`: Alle-Fünfe-UX, Gaming-Feedback II, Punkte-Duell-Graphik, Teilen-Vereinfachung, Coaching, Einstellungen-Rücknavigation |

## Produktstand Seit TestFlight 2.0 (21)

Alle folgenden Features sind im Produktcode (`de0f8f2`) und Web-Frontend gebaut; warten auf iOS-Upload `2.0 (22)` und teils Backend-Deploy:

| Feature | Commit(s) | Backend-Deploy nötig |
|---------|-----------|----------------------|
| Alle-Fünfe-Miniwürfel, Zusatz-Würfelwahl (+100), Portal-Popover | `cb101f6` | Ja (`extra_yatzy_die_values`) |
| Spielanalyse-Coaching | `3c03592` | Ja (`coaching` in API) |
| Einstellungen-Rücknavigation `?from=solo\|multi` | `3c03592` | Nein |
| Spiel-Feedback Gaming (Basis) | `a93e462` | Nein |
| Alle-Fünfe-Branding, Erfolg teilen (Canvas) | `5f90ad8` | Nein |
| Punkte-Duell-Graphik + Gaming-Feedback II | `f2d061c` | Ja (`scoreProgression`) |
| Teilen vereinfacht (nur Spielende + Bilanz, System-Share) | `82e2a01` … `de0f8f2` | Nein |

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **Punkte-Duell live:** Graphik in Multi-Analyse erst nach **Backend-Deploy** (`scoreProgression` in API).

## Wichtige Dateien

- Teilen: `frontend/lib/shareSocial.ts`, `matchResultShare.ts`, `ShareActionBar.tsx`, `HomeBentoGrid.tsx`, `RunFinishScreen.tsx`
- Analyse/Graph: `ScoreProgressionChart.tsx`, `backend/src/domain/scoreProgression.ts`, `MatchAnalysisView.tsx`
- Spiel-Feedback: `AchievementOverlay.tsx`, `achievementSound.ts`, `achievementTypes.ts`, `globals.css`
- Coaching: `backend/src/domain/matchCoaching.ts`, `frontend/lib/matchCoaching.ts`
- Zettel: `ScoreSheetTable.tsx`, `ExtraYatzyPickerOverlay.tsx`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Backend deployen** (Coaching-API + `scoreProgression` + Migration `extra_yatzy_die_values`): Nutzer per SSH `sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh`.
2. **iOS-Build `2.0 (22)`** auf dem Mac (siehe Mac-Befehle unten und `docs/ios_current.md`).
3. TestFlight: Punkte-Duell, Gaming-Feedback II, Teilen (Spielende/Bilanz), Alle-Fünfe-Branding, Mini-Würfel, Regression Footer/`/play`.
4. Optional: Pool-Endspiel Auto-Refresh.
5. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.

## Mac: iOS-Build 2.0 (22)

```bash
cd /Users/marclangebeck/projects/kniffel
git pull origin milestone-22-prep
```

Bei Konflikt in der Xcode-Projektdatei:

```bash
git restore frontend/ios/App/App.xcodeproj/project.pbxproj
git pull origin milestone-22-prep
```

Build und Xcode:

```bash
cd /Users/marclangebeck/projects/kniffel/frontend
npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

In Xcode: Team prüfen, Build-Nummer **22**, **Any iOS Device** → **Product → Archive** → Upload.

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
- Produktcode-HEAD: de0f8f2
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (21), nächster Upload 2.0 (22)
- UI-Branding: Nutzer-sichtbar „Alle Fünfe“ statt Yatzy; technische IDs (yatzyDieValue, extra-yatzy) unverändert
- Spielanalyse: Coaching + Punkte-Duell-Graphik (Multi; scoreProgression nach Backend-Deploy)
- Spiel-Feedback: Gaming-Overlays II + Layered Web-Audio; kein Share in Overlays
- Teilen: nur Spielende (RunFinishScreen) + Startscreen-Bilanz; ein Teilen-Button → System-Share (PNG)
- Alle-Fünfe-UX: Mini-Würfel, Zusatz-Würfelwahl (+100), Portal-Popover
- Einstellungen: ?from=solo|multi → Zurück zu Einzelspiel/Multiplayer
- Multi: maxPlayers Default 2, Cap 2–6; Werten/Nicht werten; Pool-Endspiel (Nicht-Sieger ggf. Aktualisieren)
- Backend-Neustart (bei Backend-Änderung): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Mac iOS-Build 2.0 (22):
cd /Users/marclangebeck/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build:ios && brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
(Xcode: Build-Nummer 22, Archive, Upload)

Offene Prioritäten:
1. Backend deployen (Coaching + scoreProgression + Migration extra_yatzy_die_values)
2. iOS TestFlight 2.0 (22) bauen und hochladen
3. TestFlight-Regression (Footer, /play, Pool-Endspiel, neue Features)
4. Optional: Pool-Endspiel Auto-Refresh
5. App Store Connect (Agreement, Bank/Steuer, Preis 1,19 EUR)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
