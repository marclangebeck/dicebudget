# Milestones – DiceBudget Strategy Edition

## Übersicht

| Block | Milestones | Status |
|-------|------------|--------|
| MVP | 1–10 | erledigt |
| UX & Modi | 11–14 | erledigt |
| Liga & Statistik | 15–19 | erledigt |
| UI-Modernisierung | 20 | erledigt |
| iOS (Capacitor) | 21 | in Arbeit |
| Datenschutz-Umbau | 22 | erledigt |
| UI/Branding-Folgepaket | 23–27 | erledigt |

*(Variante D „echtes Online-Spiel“ / Live-Sync bewusst nicht Teil dieser Milestones.)*

---

## Milestone 1: Basis-Projektstruktur

**Status:** erledigt

---

## Milestone 2: Datenmodell (Singleplayer)

- `game_count` 1–6, Run/Game/Field/Roll  
- Felder = `game_count × 13`, Max-Würfe (Strategy) = `game_count × 39`

**Status:** erledigt

---

## Milestone 3: Backend-API (Singleplayer)

- Runs, Complete, Finish, optional Rolls  
- Scoring, `rolls_in_pool`

**Status:** erledigt

---

## Milestone 4: Frontend-Grund-UI

- Setup, Play, Zettel, API-Client  
- Produktion: statischer Export + Nginx `/api`

**Status:** erledigt

---

## Milestone 5: Wurf-Pool-Mechanik

- Nur bei `useStrategyRules: true`  
- 1–3 Würfe → Rest in Pool; 4+ aus Pool; globales Limit `game_count × 39`

**Status:** erledigt (Strategy); Klassisch ohne Pool siehe Milestone 11

---

## Milestone 6: Scoring & Abschluss

- `computeGameBreakdown`, Zettel-Summen, `RunFinishScreen`  
- Overlay nach letztem Feld mit Gesamtpunktzahl (vor Finish-Screen)

**Status:** erledigt

---

## Milestone 7: Statistiken

- `GET /stats`  
- Startseite (heute Bento): **bester Gesamtscore** in der Statistik-Kachel; ausführliche Paarungsstatistik auf `/stats` (Milestone 16)

**Status:** erledigt (vereinfacht, später um Paarungen erweitert)

---

## Milestone 8: Multiplayer-Datenmodell & API

- `GameSession`, `Player`, `use_strategy_rules`  
- `/sessions`, Join, `X-Player-Secret`

**Status:** erledigt

---

## Milestone 9: Multiplayer-Frontend

- `/multi` Host, `/multi/join?code=…`, `/play`  
- Code auf Startseite, Resume-Banner

**Status:** erledigt

---

## Milestone 10: Rangliste & Gewinner

- `GET …/ranking`, Lobby-Tab, Finish-Links

**Status:** erledigt

---

## Milestone 11: UX, Modi & Produktionsreife (laufend)

Ziel:

- Zwei Spielmodi: **Strategy Edition** (Default) vs. **Klassisches Kniffel**
- Klare UI, PWA, sinnvoller Abschluss-Flow

Deliverables (Stand):

| Thema | Status |
|--------|--------|
| Toggle Raum erstellen (`useStrategyRules`) | erledigt |
| Backend-Regeln Klassisch (max. 3 Würfe/Feld, kein Pool) | erledigt |
| UI ohne Pool/Würfe bei Klassisch | erledigt |
| Overlay „X Punkte erzielt“ nach letztem Feld | erledigt |
| `abandon` Run | erledigt |
| Helles UI + Kontrast | erledigt (Feintuning möglich) |
| PWA Manifest/Icons | erledigt |
| Solo: gleicher Modus-Toggle | → **Milestone 12** |
| Server-Validierung Score pro Feldtyp | → **Milestone 13** |
| Tests (Unit) | → **Milestone 14** |

Akzeptanzkriterien (für Milestone 11 erfüllt):

- Host wählt Modus vor Raumerstellung; Gäste sehen Modus in Lobby
- Klassisch: keine Pool-Anzeige, kein Wurfzähler im Eintrag
- Strategy: unverändert zur Spezifikation in `projektbeschreibung.md`

**Status:** erledigt (offene Punkte in Milestones 12–14 ausgelagert)

---

## Milestone 12: Solo-Toggle Spielmodus

**Ziel:** Singleplayer kann vor Start dieselbe Moduswahl treffen wie der MP-Host — **Strategy Edition** (Default) oder **Klassisches Kniffel**.

**Abhängigkeiten:** Milestone 11 (MP-Toggle, Backend `POST /runs` mit `useStrategyRules`).

### Deliverables

| # | Aufgabe | Dateien (voraussichtlich) |
|---|---------|---------------------------|
| 12.1 | State `useStrategyRules` (Default `true`) in `GameSetup` | `frontend/components/GameSetup.tsx` |
| 12.2 | Wiederverwendung `StrategyModeToggle` (wie `/multi`) | `frontend/components/StrategyModeToggle.tsx` |
| 12.3 | `createRun(gameCount, useStrategyRules)` im API-Client | `frontend/lib/api.ts` |
| 12.4 | Hilfstexte abhängig vom Modus (Felder/Würfe nur bei Strategy) | `GameSetup.tsx` |
| 12.5 | Manueller Check: Solo Klassisch → kein Pool in `/play`; Solo Strategy unverändert | — |

### Akzeptanzkriterien

- [x] Toggle sichtbar auf der Startseite im Solo-Setup, **Standard: Strategy an**
- [x] `POST /runs` sendet `{ gameCount, useStrategyRules }` entsprechend der Wahl
- [x] Neuer Solo-Run verhält sich identisch zum MP-Run desselben Modus (Klassisch: `rollsUsed: 1`, kein Pool-UI)
- [x] Keine Regression bei MP (`/multi` unverändert funktionsfähig)

### Nicht im Scope

- Server-Validierung der Scores (Milestone 13)
- Automatisierte Tests (Milestone 14)
- Änderungen an Scoring- oder Pool-Regeln

### Geschätzter Aufwand

**Klein** (ca. 0,5–1 Tag) — API und UI-Komponente existieren bereits.

**Status:** erledigt (Mai 2026)

---

## Milestone 13: Server-Validierung Punktwerte

**Ziel:** `POST …/complete` akzeptiert nur Scores, die zum `fieldType` passen — unabhängig vom Client (Schutz vor manipulierten Requests, konsistent mit UI-Buttons).

**Abhängigkeiten:** Milestone 12 empfohlen (beide Modi manuell prüfbar), technisch unabhängig umsetzbar.

### Ausgangslage

- Frontend: `fieldScoreChoices()` in `frontend/lib/labels.ts` definiert erlaubte Werte pro Feldtyp
- Backend: `completeField()` prüft Rolls/Pool/Status, **nicht** ob `score` zum Feldtyp passt

### Deliverables

| # | Aufgabe | Dateien (voraussichtlich) |
|---|---------|---------------------------|
| 13.1 | Domain-Funktion `assertValidScoreForField(fieldType, score)` mit gleicher Logik wie UI | `backend/src/domain/fieldScores.ts` (neu) oder Port der Choice-Tabellen |
| 13.2 | Aufruf in `completeField()` vor Persistenz | `backend/src/services/playField.ts` |
| 13.3 | HTTP 400 + klare Fehlermeldung bei ungültigem Score | `backend/src/routes/…`, `errorHandler` |
| 13.4 | Optional: gemeinsame Konstanten dokumentieren (Frontend/Backend-Duplikat akzeptiert, kein Shared-Package nötig) | Kommentar in beiden Dateien |
| 13.5 | Manueller Negativtest: `curl` mit falschem `score` → 400 | — |

### Regeln (Referenz, identisch zu `labels.ts`)

| Feldgruppe | Erlaubte Scores |
|------------|-----------------|
| ONES … SIXES | `0`, `n×Augenzahl` für `n ∈ 1..5` |
| THREE_OF_A_KIND, FOUR_OF_A_KIND, CHANCE | `0..30` |
| FULL_HOUSE, SMALL_STRAIGHT, LARGE_STRAIGHT, KNIFFEL | feste Regelpunkte oder `0` (streichen) |

### Akzeptanzkriterien

- [x] Jeder gültige UI-Button-Wert wird vom Server akzeptiert (beide Modi)
- [x] Ungültige Werte (z. B. `7` bei ONES, `99` bei KNIFFEL) → **400**, Feld bleibt offen
- [x] Bestehende Pool-/Rolls-Validierung unverändert
- [x] Kein Schema-Migration nötig

### Nicht im Scope

- Validierung „passt der Score zu echten Würfeln“ (physikalische Kniffel-Logik) — nur **erlaubte Eintragsmenge**
- Frontend-Änderung außer ggf. Anzeige der Server-Fehlermeldung

### Geschätzter Aufwand

**Klein–mittel** (ca. 1 Tag inkl. manueller Checks).

**Status:** erledigt (Mai 2026)

---

## Milestone 14: Unit-Tests Kernlogik

**Ziel:** Automatisierte Regressionstests für Scoring und Spiellogik (Strategy vs. Klassisch), ohne E2E-Browser-Setup.

**Abhängigkeiten:** Milestone 13 abgeschlossen (Tests für Score-Validierung mit abdecken).

### Deliverables

| # | Aufgabe | Dateien (voraussichtlich) |
|---|---------|---------------------------|
| 14.1 | Test-Runner im Backend (z. B. **Node `node:test`** oder **Vitest** — eine Wahl, dokumentiert in README Backend) | `backend/package.json` |
| 14.2 | Tests `gameScoring`: Bonus 63/35, `gameTotal`, Summen über Spiele | `backend/src/domain/gameScoring.test.ts` |
| 14.3 | Tests `playField` / Hilfsfunktionen: Pool-Delta, Roll-Limits, Klassisch `rollsUsed === 1` | `backend/src/services/playField.test.ts` oder `domain/` |
| 14.4 | Tests `assertValidScoreForField` (Milestone 13) | `backend/src/domain/fieldScores.test.ts` |
| 14.5 | Script `npm test` im Backend; optional in CI-Vorbereitung dokumentiert | `backend/package.json`, Root-README kurz |
| 14.6 | Keine Dauerprozesse / keine Netzwerk-Tests gegen Prod-Domain (`AGENT_RULES.md`) | — |

### Akzeptanzkriterien

- [x] `cd backend && npm test` läuft lokal grün ohne laufende API
- [x] Mindestens je ein Testfall: Strategy-Pool (spare/cost), Klassisch ohne Pool, ungültiger Score abgewiesen
- [x] `gameScoring`-Randfälle: genau 63 oben → Bonus; unter 63 → kein Bonus
- [x] Tests nutzen In-Memory/Fixtures oder Prisma-Test-DB — **kein** Polling, **kein** paralleler Dev-Server nötig

### Nicht im Scope (v1)

- Playwright/Cypress E2E
- Frontend-Unit-Tests
- Load-Tests / Multiplayer-Sync-Tests

### Geschätzter Aufwand

**Mittel** (ca. 1–2 Tage, abhängig von Test-DB-Strategie für `playField`).

**Status:** erledigt (Mai 2026)

---

## Reihenfolge & Definition of Done (12–14)

```mermaid
flowchart LR
  M12[Milestone 12\nSolo-Toggle]
  M13[Milestone 13\nScore-Validierung]
  M14[Milestone 14\nUnit-Tests]
  M12 --> M13 --> M14
```

| Milestone | DoD kurz |
|-----------|----------|
| **12** | Solo startet mit gewähltem Modus; MP unberührt |
| **13** | API lehnt illegale Scores ab; UI-Fehler optional sichtbar |
| **14** | `npm test` grün; Kernpfade Strategy/Klassisch abgedeckt |

Nach Abschluss von 14: `HANDOVER.md` und `CHANGELOG.md` aktualisieren; Deploy-Hinweis nur bei Schema-Änderung (hier nicht erwartet).

---

## Milestone 15: Serien & Ligapunkte

**Ziel:** Multiplayer-Runden zu einer **Serie** (`leagueCode`) bündeln; nach jeder abgeschlossenen Runde Siegpunkte und Differenz-Bonus fortschreiben.

### Deliverables

| Thema | Status |
|--------|--------|
| Prisma `League`, `LeagueStanding`, Session-Felder `leagueId`, `roundNumber`, `pointsAwarded` | erledigt |
| `computeRoundPoints`, `awardSessionLeaguePoints` | erledigt |
| Lobby: Serien-Rangliste, „Neue Runde in derselben Serie“ | erledigt |
| Tests `leaguePoints` | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 16: Paarungsstatistik

**Ziel:** Direktvergleich zweier Spieler über abgeschlossene MP-Runden; eigene Statistik-Seite.

### Deliverables

| Thema | Status |
|--------|--------|
| `GET /stats/pairings`, `GET /stats/pairing?key=` | erledigt |
| `/stats`, `/stats/pairing?key=…` (statischer Export) | erledigt |
| Button „Statistik“ auf Startseite | erledigt |
| Head-to-Head-Logik in `pairingStats.ts` | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 17: Namen & manuelle Historie

**Ziel:** Gleiche Person unter verschiedenen Namen zusammenführen; Spiele vor App-Start in Paarungszahlen einbeziehen.

### Deliverables

| Thema | Status |
|--------|--------|
| `player_name_aliases`, API `/stats/names` | erledigt |
| `pairing_manual_baselines`, Aggregation in `pairingStats` | erledigt |
| UI `NameMergePanel` auf `/stats` | erledigt |
| Aliase in Ligapunkte-Aggregation | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 18: Letzten Eintrag löschen

**Ziel:** Nur das zuletzt eingetragene Feld zurücksetzen und anderes Feld wählen (Solo + MP).

### Deliverables

| Thema | Status |
|--------|--------|
| `scored_sequence` / `next_scored_sequence` | erledigt |
| `POST …/fields/:fieldId/clear`, `lastScoredFieldId` im Run-DTO | erledigt |
| UI „Eintrag löschen“ in `ScoreEntryPanel` | erledigt |
| Backfill für alte Runs | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 19: Zusatz-Yatzy & Produktionsreife Statistik

**Ziel:** Ab 7. Yatzy +100 pro Klick; stabiler Produktions-Build der Statistik-UI.

### Deliverables

| Thema | Status |
|--------|--------|
| `extra_yatzy_count`, `extra_yatzy_bonus`, API `extra-yatzy` | erledigt |
| UI `+`-Button, Anzeige auf Zettel | erledigt |
| `.env.production`, defensive API-Normalisierung, `error.tsx` für Paarung | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 20: UI-Modernisierung (Bento, Statistik, Setup, Spielzettel)

**Ziel:** Einheitliches, übersichtliches Glass-UI; Spielzettel passt auf **einen Screen ohne Seiten-Scroll**, alle Funktionen bleiben erhalten.

### Deliverables

| Thema | Status |
|--------|--------|
| Start: `HomeBentoGrid` (Raum erstellen groß, Einzelspiel, Statistik, Code volle Breite) | erledigt |
| `HomeModeButtons` entfernt | erledigt |
| Statistik: `AppScreenHeader`, `PairingSummaryCard`, `.stats-*` | erledigt |
| Setup `/solo`, `/multi`: `AppScreenHeader`, `SetupScreenLayout` | erledigt |
| Spiel `/play`: `PlayTopBar`, `.play-*`, fixiertes `ScoreEntryPanel` | erledigt |
| `FitScoreSheet` + `PlayScreenShell` — kein Scroll im aktiven Spiel | erledigt |
| Finish-Ansicht scrollt bei Bedarf (mehr Inhalt) | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 21: iOS-App (Capacitor)

**Ziel:** **dice.budget** im Apple App Store (Zielpreis **1,19 €**); Web-Produktion parallel unverändert.

**Leitfaden:** [GOiOS.md](./GOiOS.md) (Prozess, Sub-Milestones, Agent-Prompt).

### Deliverables

| Thema | Status |
|--------|--------|
| Capacitor 7, `ios/`, Bundle `de.bottletrade.dicebudget` | erledigt |
| API nativ → `dicebudget.bottle-trade.de/api` | erledigt |
| Native Start → `/app` (kein Landing in der App) | erledigt |
| Developer App-ID `de.bottletrade.dicebudget` | erledigt |
| GitHub `marclangebeck/dicebudget` | erledigt |
| Mac: Simulator läuft | erledigt |
| Doku (`docs/ios-*`, `GOiOS.md`) | erledigt |
| App Store Connect App **dice.budget** (neu, nicht `com.mlangebeck.mobileapp`) | in Arbeit |
| Geschäftliches: Paid-Vertrag, Bank, Steuer, EU-Compliance | offen |
| Preis 1,19 €, Store-Metadaten | offen |
| Archive → TestFlight → Review | offen |

**Status:** in Arbeit (Mai 2026) — technische Basis erledigt; Store/Connect auf Mac durch Nutzer.

---

## Offene Ideen (kein Milestone)

- Admin-UI für `pairing_manual_baselines`
- Frontend- / E2E-Tests
- Echte Würfel-UI

---

## Milestone 22: Datenschutz-Umbau (lokal Solo, pseudonymes Multi)

**Zielbild (empfohlen):**

- Solo: komplett lokal auf dem Gerät.
- Multi: zentral nur pseudonyme Spiel-Daten, keine Klarnamen.
- Vergleich zwischen zwei Spielern bleibt abrufbar, ohne Klarname auf dem Server.

**Wichtiger Realitätscheck:**

„Gar nichts auf dem Server speichern“ und gleichzeitig „dauerhafte Multiplayer-Vergleiche zwischen Geräten“ geht nicht gleichzeitig.  
Für abrufbare Multi-Statistik muss irgendeine Form von Match-Daten zentral liegen — dann aber pseudonym statt personenbezogen.

### Geplante Teilschritte

| # | Teilschritt | Kurzinhalt | Status |
|---|-------------|------------|--------|
| 22.1 | Technisches Zielmodell festziehen | `playerId` pro Gerät (UUID, lokal gespeichert), Anzeigename nur lokal, Server speichert nur pseudonyme IDs + Matchdaten | erledigt |
| 22.2 | Datenmodell Backend erweitern | Klarnamen aus kritischen Multi-Statistikpfaden herauslösen; Felder für pseudonyme IDs ergänzen | erledigt |
| 22.3 | Migrationsstrategie Alt-Daten | Bestehende Klarnamen-Historie (inkl. Manual-Baselines) entfernen oder in nicht personenbezogene Form überführen | erledigt |
| 22.4 | API für Multi anpassen | Multi-Endpunkte akzeptieren/liefern pseudonyme IDs; Vergleich `A vs B` basiert auf IDs statt Namen | erledigt |
| 22.5 | Frontend iOS/Web anpassen | `playerId` lokal erzeugen/speichern/senden; lokales Mapping `playerId -> Anzeigename` nur auf Gerät | erledigt |
| 22.6 | Solo vollständig lokal absichern | Solo-Stats/-Historie lokal speichern; kein personenbezogener Solo-Statistik-Write auf Server | erledigt |
| 22.7 | Statistik-UI umstellen | Paarungsansichten aus pseudonymen Daten berechnen; lesbare Namen nur aus lokalem Mapping auflösen | erledigt |
| 22.8 | Datenschutz-/Store-Doku aktualisieren | Datenschutzerklärung, App Privacy Angaben, technische Doku (`GOiOS.md`/`HANDOVER.md`) angleichen | erledigt |
| 22.9 | Abnahme & Rollout | Regressionstests, iOS-Rebuild (`npm run build:ios` auf Mac), neues Archive/Upload für TestFlight | erledigt |

### Akzeptanzkriterien (Definition of Done)

- [x] Neuer App-Install startet mit leeren Solo-Stats auf dem Gerät.
- [x] Server speichert in Multi-Statistik keine Klarnamen mehr.
- [x] Vergleich zwischen zwei Spielern bleibt über pseudonyme IDs funktionsfähig.
- [x] Alte personenbezogene Statistik-Baselines sind entfernt.
- [x] Dokumentation/Store-Angaben sind konsistent zum neuen Datenschutzmodell.

### Ergebnis (Sollzustand)

- Malte kann gegen Nicole vergleichen (wenn beide gespielt haben).
- Du als Betreiber speicherst keine Klarnamen.
- Historie bleibt zwischen Spielern abrufbar.
- Datenschutzrisiko ist deutlich kleiner als heute.

**Status:** erledigt (Mai 2026)

**Tag-1-Dokumentation:** `docs/milestone-22-preparation.md`

### Startreihenfolge (nach aktuellem App-Store-Connect-Durchlauf)

#### Tag 1 — Sicherheitsnetz + Datenbasis vorbereiten

1. **Branch anlegen:** separater Arbeitsbranch nur für Milestone 22.
2. **Ist-Zustand sichern:** aktuelles DB-Schema + relevante Tabellen (`players`, `game_sessions`, `pairing_manual_baselines`, `player_name_aliases`) dokumentieren.
3. **Konzept fixieren:** endgültig festschreiben, welche Felder pseudonym bleiben dürfen (IDs, Scores, Zeitstempel) und welche entfallen (Klarnamen in Statistikpfaden).
4. **Migration entwerfen:** Prisma-Migration für pseudonyme Multi-IDs vorbereiten; Umgang mit Alt-Daten (löschen/neutralisieren) festlegen.
5. **Abbruchkriterium Tag 1:** Keine Codepfade geändert, aber Migrations-/Datenplan ist schriftlich final und freigegeben.

#### Tag 2 — Backend pseudonym machen

1. **Schema umsetzen:** neue pseudonyme ID-Felder für Multi-Flows einführen.
2. **API umstellen:** Multi-/Statistik-Endpunkte intern auf IDs statt Klarnamen umstellen.
3. **Alt-Baselines entfernen:** `pairing_manual_baselines` aus aktivem Statistikpfad entfernen; Alt-Klarnamen-Historie gemäß Plan bereinigen.
4. **Regression prüfen:** bestehende Multiplayer-Kernflüsse lokal testen (Raum erstellen, beitreten, Runde beenden, Vergleich abrufen).
5. **Abbruchkriterium Tag 2:** Backend liefert funktionsfähige Vergleichsdaten ohne Klarnamenpersistenz in den Zielpfaden.

#### Tag 3 — Frontend/Client lokalisieren + Abnahme

1. **`playerId` lokal einführen:** beim ersten Start UUID erzeugen und lokal speichern.
2. **Lokales Namens-Mapping:** Anzeigename nur lokal halten (`playerId -> Anzeigename`), nicht serverseitig persistieren.
3. **Solo lokal absichern:** Solo-Statistik ausschließlich lokal lesen/schreiben.
4. **UI-Checks:** Statistikseiten mit pseudonymen Serverdaten + lokal aufgelösten Namen prüfen.
5. **Doku & Release-Check:** Datenschutzerklärung/App-Privacy-Texte angleichen, dann iOS-Rebuild (`npm run build:ios` auf Mac), Buildnummer erhöhen, Archive/Upload.
6. **Abbruchkriterium Tag 3:** DoD aus Milestone 22 vollständig erfüllt und testbar dokumentiert.

#### Go/No-Go vor Produktionsstart

- [x] Aktueller App-Store-Connect-Build ist abgeschlossen (kein offener Blocking-Status).
- [ ] Milestone-22-Plan ist freigegeben.
- [ ] Zeitfenster für Migration + Rebuild + Retest ist eingeplant.

---

## Milestone 23: Navigation-Polish (Startseite/Zurück)

**Ziel:** „Startseite“/„Zurück“-Navigation im gesamten App-Flow moderner, klarer und konsistent im Glass-Design darstellen.

### Deliverables

| Thema | Status |
|--------|--------|
| Einheitliche Back/Home-Button-Komponente (Form, Größe, Kontrast, Fokuszustand) | erledigt |
| Verwendung in `AppScreenHeader`, `PlayTopBar` und relevanten Detailseiten | erledigt |
| Touch-optimierte Hit-Targets (iOS) | erledigt |

**Status:** erledigt (Mai 2026, TestFlight Build 11)

---

## Milestone 24: Eröffnungsscreen (Splash A)

**Entscheidung:** Variante A (animierter Intro-Screen bei Start).

**Ziel:** Schwarzer Intro-Screen mit `dice.budget`, zwei Würfeln und Fortschrittskreis 0–100%, danach weicher Übergang zur App-Startseite.

### Deliverables

| Thema | Status |
|--------|--------|
| Intro-Overlay mit Branding auf schwarzem Hintergrund | erledigt |
| Progress-Ring 0–100% (visuelle Ladeführung) | erledigt |
| Transition/Fade zum bestehenden Home-Screen | erledigt |

**Status:** erledigt

---

## Milestone 25: Startseite Header/Hero präsenter

**Ziel:** Logo + Schriftzug auf der Startseite sichtbar größer und mittiger/breiter positionieren.

### Deliverables

| Thema | Status |
|--------|--------|
| Header-Bereich über größere Breite aufziehen | erledigt |
| Logo + Wortmarke visuell priorisieren (Spacing/Typo) | erledigt |
| Responsives Feintuning für iPhone-Größen | erledigt |

**Status:** erledigt

---

## Milestone 26: Kachel-Visuals (Icons vs. Bilder)

**Entscheidung:** Icons bleiben als Primärsprache; keine vollständige Umstellung auf Bilder.

**Ziel:** Klarheit der Navigation beibehalten, visuell aufwerten über subtile Hintergründe/Illustrationsakzente statt Foto-Kacheln.

### Deliverables

| Thema | Status |
|--------|--------|
| Bestehende Icons beibehalten (Solo/Multi/Stats) | erledigt |
| Optionale Hintergrund-Illustrationsakzente je Kachel | erledigt |
| Kontrast/Lesbarkeit im Bento-Grid sichern | erledigt |

**Status:** erledigt (Mai 2026)

---

## Milestone 27: Datenschutzseite (App-zentriert)

**Ziel:** Datenschutztext auf app-zentrierte Nutzung ausrichten (Spiel primär in der App, konsistent mit tatsächlichem Verhalten).

### Deliverables

| Thema | Status |
|--------|--------|
| Formulierungen auf App-first Nutzung anpassen | erledigt |
| Technische Speicherung korrekt und verständlich beschreiben | erledigt |
| Konsistenz mit App Store Angaben prüfen | erledigt (Legal live, Connect-Fragebogen offen) |

**Status:** erledigt (Mai 2026)

---

## Aktueller Arbeitsstand (2026-05-29)

**Commit:** `aac288f` · Branch `milestone-22-prep` · Mac/Server/GitHub synchron

**Erledigt:**

- Legal-Links `Datenschutz` / `Impressum` auf `/app`
- Einheitlicher `← Startseite`-Button (`app-nav-btn`)
- Größere SVG-Kachel-Icons, dunkler Slate-Verlauf app-weit
- Datenschutz/Impressum: Scroll + Safe-Area unter Statusleiste
- **Impressum + Datenschutz** mit Anbieterangaben Marc Langebeck (`frontend/lib/legal.ts`) — live auf dicebudget.bottle-trade.de
- **bottle-trade.de** Impressum/Datenschutz analog aktualisiert (Server: `bottle-trade-platform/`, kein Git)
- Web-Frontend auf Produktion deployed
- TestFlight **Build 1.0 (11)** — aktuell; kein neuer iOS-Upload bis Nutzer batched
- Dokumentation synchronisiert

**Nächste Schritte (Priorität):**

1. **App Store Connect:** Paid Applications Agreement, Bank/Steuer
2. **Store-Metadaten:** Preis 1,19 €, Screenshots 6.7", Beschreibung DE
3. **App-Datenschutzfragebogen** in Connect (URL: https://dicebudget.bottle-trade.de/datenschutz)
4. **Review:** TestFlight Build 11 stabil → „Zur Überprüfung einreichen“
5. Optional: Branch `milestone-22-prep` → `main` (nur nach Nutzer-Freigabe)
6. Optional: `bottle-trade-platform` in Git versionieren (Backup)
