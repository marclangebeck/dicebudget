# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `d130be7` (Spiel-UX: Werten/Nicht werten, Yatzy-Strichliste, Zettel-/Settings-Politur)  
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
| Produktcode | HEAD `d130be7`; Web deployed (Frontend `out/` + Backend-Service mit Migration `20260605120000_pairing_stats_yatzy_die`) |
| Backend | Migration: `include_in_pairing_stats` auf `GameSession`, `yatzy_die_value` auf `Field`; Endpoint `POST /sessions/invite/:code/finalize-stats` |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (6)`, nächster Upload `2.0 (7)` |
| Noch nicht in iOS `2.0 (6)` | M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard + Footer/Legal + 3D-Icons + Spiel-UX Juni 2026 (Werten/Nicht werten, Yatzy-Strichliste, Settings-Gruppen, …) |

## Neu Seit Letzter Übergabe (2026-06-05)

- **Spielzettel Ergebnis 1/2 dunkel:** Zeilen- und Zellenhintergrund von „Ergebnis 1“ und „Ergebnis 2“ an dunklen Spielzettel angeglichen (kein Hellgrau mehr).
- **Multiplayer: Werten / Nicht werten:** Auf dem Abschluss-Screen (`RunFinishScreen`) und beim Verlassen aus der Zettelansicht entscheidet ein Switch (Design wie `/settings`), ob die Session in die Paarungs-Statistik einfließt. Stats werden **nicht** mehr automatisch vergeben; Finalisierung beim Verlassen über `POST /sessions/invite/:code/finalize-stats`. Feld `include_in_pairing_stats` (Default `true` für Rückwärtskompatibilität).
- **Yatzy-Würfel-Strichliste:** Beim Yatzy-Eintrag (50 Punkte) Abfrage der Augenzahl 1–6; goldene Strichliste hinter dem passenden Würfel auf dem Zettel. Backend: `fields.yatzy_die_value`; Solo lokal in `localSoloRun.ts`.
- **Toggles einheitlich:** `.app-toggle` blassgrün (an) / blassrot (aus) app-weit in Settings und Setup.
- **Startscreen-Icons +75 %:** 3D-PNG-Motive vergrößert (CSS).
- **Einstellungen gruppiert:** Bereiche Allgemein, Solo, Multi, iPad; iPad-Spielernamen nur bei aktivem iPad-Tisch editierbar.
- **Stats-Toggle wie Einstellungen:** „Werten“ / „Nicht werten“ als Settings-Switch-Karte (nicht mehr als zwei Buttons neben einander).
- **Fix Multi-Abschluss „Internal Server Error“ (2026-06-06):** `finalize-stats` verlangte fälschlich mindestens 2 Spieler; Einzelspieler-Tests in Multi-Räumen schlugen fehl. `SessionNotReadyError` wurde nicht abgefangen → 500. Jetzt: Abschluss ab 1 Spieler möglich; Paarungs-Statistik (`Werten`) erst ab 2 Spielern; klare **409**-Meldungen (Pool-Endspiel offen / Mitspieler nicht fertig); Fehlertext auf `RunFinishScreen`.

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nach Pool-Endspiel sehen Nicht-Sieger oft noch „Pool-Endspiel läuft“ und müssen **Aktualisieren** tippen, bevor der Abschluss-Screen mit dem Toggle erscheint. Verbesserung (Auto-Refresh nach Pool-Auflösung) ist sinnvolle Folgeaufgabe.

## Wichtige Dateien

- `frontend/components/StatsRatingToggle.tsx` — Switch Werten/Nicht werten (Settings-Design)
- `frontend/components/RunFinishScreen.tsx` — Multi-Abschluss inkl. Statistik-Entscheidung
- `frontend/components/PlayBoard.tsx` — Multi-Flow, Pool-Endspiel, Zettel-Abschluss
- `frontend/components/TableModePlayBoard.tsx` — iPad-Tischmodus inkl. Statistik-Toggle
- `frontend/components/ScoreEntryPanel.tsx` — Yatzy-Würfel-Abfrage
- `frontend/components/ScoreSheetTable.tsx` — Yatzy-Strichliste, dunkle Ergebniszeilen
- `frontend/app/settings/page.tsx` — gruppierte Einstellungen
- `backend/src/services/sessionService.ts` — `finalizeSessionStats`, kein Auto-Award mehr
- `backend/src/middleware/errorHandler.ts` — `SessionNotReadyError` → 409
- `backend/src/routes/sessions.ts` — `finalize-stats`
- `backend/src/services/playField.ts` — `yatzyDieValue` bei `completeField`
- `backend/prisma/migrations/20260605120000_pairing_stats_yatzy_die/`
- `frontend/app/globals.css` — `.app-toggle`, Zettel, Startscreen-Icons, Settings-Gruppen
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. iOS-Build `2.0 (7)` auf dem Mac: enthält alles seit `2.0 (6)` inkl. Spiel-UX Juni 2026.
2. TestFlight: Multi-Abschluss mit Werten/Nicht werten, Pool-Endspiel-Flow, Yatzy-Strichliste, footerfreier `/play`, Footer auf App-Screens.
3. Optional: Nach Pool-Endspiel automatisch Lobby aktualisieren, damit der Statistik-Toggle ohne manuelles Aktualisieren erscheint.
4. App Store Connect: Paid Applications Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.
5. Optional später: Stats-Reset-/Baseline-Endpunkte auf eigene Paarungen einschränken; `milestone-22-prep` → `main`.

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
- Produktcode-HEAD: d130be7 (Spiel-UX Juni 2026)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), nächster Upload 2.0 (7)
- Backend-Migration: include_in_pairing_stats, yatzy_die_value; Endpoint POST …/finalize-stats
- Multi-Statistik: Switch „Werten“/„Nicht werten“ (Settings-Design) auf RunFinishScreen; Entscheidung beim Verlassen zur Startseite; keine Auto-Statistik mehr
- finalize-stats: Einzelspieler-Multi-Räume können abschließen; „Werten“ zählt Paarungen erst ab 2 Spielern; bei Blockade 409 mit deutscher Meldung (nicht 500)
- Yatzy: bei 50 Punkten Würfel 1–6 wählen; Strichliste hinter Würfelzeile auf dem Zettel
- Spielzettel: Ergebnis 1/2 dunkler Hintergrund; /play ohne Footer
- Settings: Gruppen Allgemein/Solo/Multi/iPad; iPad-Namen nur bei aktivem Tischmodus
- Startscreen: 3D-Icons aus frontend/public/home-icons/ (+75 % Größe)
- Toggles app-weit: .app-toggle blassgrün/blassrot
- Pool-Endspiel: Nicht-Sieger ggf. „Aktualisieren“ nötig, bevor Abschluss-Toggle sichtbar (bekanntes UX-Thema)
- Backend-Neustart (nur bei Backend-Änderung): Nutzer per SSH auf Server:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
  (Nicht auf dem Mac mit /home/bottleadmin/… ausführen.)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
