# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `66e715a`  
**Sprache:** Deutsch

Diese Datei ist die kompakte Startübergabe. Aktiver Arbeitsstand: `docs/milestones_active.md`. iOS/TestFlight/App Store: `docs/ios_current.md`. Dauerhafte Projektentscheidungen nur bei Bedarf: `docs/decisions.md`.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9 ist Pflicht: Nach jeder Code-Änderung GitHub, Server und Mac synchronisieren und nummerierte `[Server]`-/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung — **außer** wenn der Nutzer explizit Commit/Push anweist.
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
| Produktcode | HEAD `66e715a`; Frontend `out/` gebaut |
| Backend | Coaching-API, `scoreProgression`, Migration `extra_yatzy_die_values` — Deploy-Status durch Nutzer prüfen |
| UI-Branding | Nutzer-sichtbar **Alle Fünfe** statt „Yatzy“; technische IDs unverändert |
| Teilen | **Nur** Spielende (`RunFinishScreen`) + Startscreen-Bilanz; ein **Teilen**-Button → System-Share (PNG) |
| Multi-Raum | **Code teilen** (System-Share) statt Kopieren nach Raum-Anlegen |
| Spiel-Feedback | Granular unter `/settings/feedback`: Animationen, Sounds, Fortschritt 25/50/75 % |
| Fortschritt | Overlay + Sound bei 25/50/75 % der Felder; **Warteschlange** hinter Erfolgs-Overlays |
| Zettel | Ergebnis 1/2/Spiel in Feld-Spalte mit gleichen Farben wie Wertespalten |
| iOS/TestFlight | Version `2.0`, aktueller Build **`2.0 (25)`**, nächster Upload **`2.0 (26)`** |

## Letzte Produktänderungen (Commits `02e0857` … `66e715a`)

| Feature | Commit | Backend nötig |
|---------|--------|---------------|
| Zettel: Ergebnis-Zeilen Farben in Feld-Spalte | `02e0857` | Nein |
| Multi: Raum-Code teilen | `02e0857` | Nein |
| Fortschritt 25/50/75 % Overlay + Sound | `02e0857` | Nein |
| Spiel-Feedback granular (`/settings/feedback`) | `02e0857` | Nein |
| Fortschritt nach Erfolgs-Overlay (Warteschlange) | `66e715a` | Nein |

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **Punkte-Duell live:** Graphik in Multi-Analyse erst nach **Backend-Deploy** (`scoreProgression` in API), falls noch nicht deployed.

## Wichtige Dateien

- Zettel: `ScoreSheetTable.tsx`, `globals.css`
- Multi-Teilen: `multi/page.tsx`, `shareSocial.ts`
- Fortschritt: `runProgressFeedback.ts`, `feedbackOverlayQueue.ts`, `RunProgressOverlay.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`
- Feedback-Einstellungen: `gameFeedbackPrefs.ts`, `settings/feedback/page.tsx`, `BonusCelebrationToggle.tsx`
- Spiel-Feedback: `AchievementOverlay.tsx`, `achievementSound.ts`, `achievementFeedback.ts`
- Teilen: `ShareActionBar.tsx`, `HomeBentoGrid.tsx`, `RunFinishScreen.tsx`
- Analyse: `MatchAnalysisView.tsx`, `ScoreProgressionChart.tsx`, `backend/src/domain/scoreProgression.ts`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Backend deployen** (falls noch offen): Coaching + `scoreProgression` + Migration `extra_yatzy_die_values` — Nutzer per SSH `sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh`.
2. **iOS-Build `2.0 (26)`** auf dem Mac, falls Produktcode `66e715a` noch nicht in TestFlight `2.0 (25)` enthalten ist.
3. TestFlight-Regression: Footer, `/play`, Pool-Endspiel, Fortschritt-Overlay, Code teilen, Feedback-Toggles.
4. Optional: Pool-Endspiel Auto-Refresh.
5. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.

## Mac: iOS-Build 2.0 (26)

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

In Xcode: Team prüfen, Build-Nummer **26**, **Any iOS Device** → **Product → Archive** → Upload.

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
- Produktcode-HEAD: 66e715a
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (25), nächster Upload 2.0 (26)
- UI-Branding: Nutzer-sichtbar „Alle Fünfe“ statt Yatzy; technische IDs (yatzyDieValue, extra-yatzy) unverändert
- Zettel: Ergebnis 1/2/Spiel in Feld-Spalte mit gleichen Farben wie Wertespalten
- Multi: Raum-Code teilen (System-Share) statt kopieren
- Fortschritt: Overlay + Sound bei 25/50/75 %; erscheint auch nach Erfolgs-Overlays nacheinander
- Spiel-Feedback: granular unter /settings/feedback (Animationen, Sounds, Fortschritt)
- Spielanalyse: Coaching + Punkte-Duell-Graphik (Multi; scoreProgression nach Backend-Deploy)
- Teilen: nur Spielende (RunFinishScreen) + Startscreen-Bilanz; ein Teilen-Button → System-Share (PNG)
- Alle-Fünfe-UX: Mini-Würfel, Zusatz-Würfelwahl (+100), Portal-Popover
- Einstellungen: ?from=solo|multi → Zurück zu Einzelspiel/Multiplayer
- Multi: maxPlayers Default 2, Cap 2–6; Werten/Nicht werten; Pool-Endspiel (Nicht-Sieger ggf. Aktualisieren)
- Backend-Neustart (bei Backend-Änderung): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Mac iOS-Build 2.0 (26):
cd /Users/marclangebeck/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build:ios && brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
(Xcode: Build-Nummer 26, Archive, Upload)

Offene Prioritäten:
1. Backend deployen (falls noch offen: Coaching + scoreProgression + Migration extra_yatzy_die_values)
2. iOS TestFlight 2.0 (26) bauen und hochladen (falls 66e715a noch nicht in 2.0 (25))
3. TestFlight-Regression (Footer, /play, Pool-Endspiel, Fortschritt, Code teilen, Feedback-Toggles)
4. Optional: Pool-Endspiel Auto-Refresh
5. App Store Connect (Agreement, Bank/Steuer, Preis 1,19 EUR)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
