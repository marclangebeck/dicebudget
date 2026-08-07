# Aktive Milestones - dice.budget

**Stand:** 2026-07-31  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `f5a2665` (Hausregeln auto/Toggles/Info, Fortschritt-Delta, Statistik lokal, Feldeintrag schneller)  
**Produktiv:** Web/API live unter https://dicebudget.bottle-trade.de — **Backend-Deploy** (Migration `20260725120000` + HEAD) bei Bedarf prüfen

Dieses Dokument ist der kompakte Arbeitsstand fuer Agenten. Aeltere Milestones stehen in `docs/milestones_archive.md`.

## Aktueller Milestone

### Milestone 21 - iOS-App / App Store

**Status:** in Arbeit.

Technische Basis ist erledigt:

- Capacitor 7, iOS-Projekt und Bundle `de.bottletrade.dicebudget` sind vorhanden.
- Native App startet direkt auf `/app`.
- Native API-Basis zeigt auf `https://dicebudget.bottle-trade.de/api`.
- TestFlight ist aktiv; **aktueller Build `2.0 (28)`** mit Produktcode **`d8b5952`** (Cinematic Editorial Startscreen).
- **Web-HEAD `f5a2665`:** UX-Politur II + Auto-Hausregeln (2×/3× Alle Fünfe, Oberer Bereich), Info-„i“, Fortschritts-Delta nur Feldpunkte, Statistik Paarungen lokal löschen, Feldeintrag-Performance — **noch nicht in iOS** (Build 29 ausstehend).
- iOS-UI kommt nur aus `npm run build:ios` auf dem Mac (`ios/App/App/public/` ist gitignored).

Offen (M30):

- iOS-Upload **Build `2.0 (29)`** nach `npm run build:ios` auf Mac (HEAD `f5a2665`).
- TestFlight-Regression: siehe `docs/ios_current.md` (inkl. neue Hausregeln, Fortschritt-Delta, Statistik lokal löschen).
- App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.
- Backend Prod: Migration + Deploy prüfen, falls Auto-Regeln live fehlen.

Details: `docs/ios_current.md`.

## Geplante Milestones

### Nutzer-Wunschliste 2026-07-31 (M37–M41) — Spezifikation, kein Code ohne GO

Priorität laut Nutzer. Details und Sprints: `docs/milestone-roadmap-analysis.md`. **Kein Produktcode** bis GO je Milestone.

| Prio | Milestone | Kurz |
|------|-----------|------|
| 1 | **M37** Fortschritts-Delta 25/50/75 % | Nur Feldpunkte Spieler vs. Mitspieler; Bugfix |
| 2 | **M38** Paarungs-Rollen & Sync | Spieler: IDs/Namen; Admin: Bereinigen; gleiche Bilanz |
| 3 | **M39** Versionsanzeige Menü | Hamburger zeigt aktuelle Version |
| 4 | **M40** Spalten-Pool-Boni | Oben/Unten/Kombi +2 Pool, max. 6 — **Spezifikation zur Freigabe** |
| 5 | **M41** 2×/3× Alle Fünfe nur bei 50 | Null-Einträge lösen keine Pool-Strafe |

### M37 — Fortschritts-Delta nur Feldpunkte (Bugfix)

**Status:** umgesetzt (Code); wartet auf Commit/Frontend-Build-Abnahme.  
**Ist-Fix:** kein `totalScore`-Fallback; bei Meilenstein frische Lite-Lobby; Unit-Tests `runProgressFeedback.test.ts`.  
**Soll:** Summe nur eingetragener Feld-Scores (ohne Bonus/Extra-Yatzy) von mir vs. dem anderen Teilnehmer; Anzeige bei 25/50/75 %.

### M38 — Paarungen: Sync vs. Admin-Bereinigung

**Status:** umgesetzt; **Stufe 0** (2026-08): Admin-Workflow UI (Baseline / Server bereinigen global; lokales Ausblenden mit Extra-Warnung).  
**Rollen:** Spieler = lokal ausblenden + Rivalen/Namen; Admin = Siege/Diff + Server bereinigen.  
**API:** `baseline` wieder `requireAdminKey` (Tests angepasst).  
**Offen optional:** Stufe A — pseudonyme `playerId`-Links nur bei nachgewiesenem Bilanz-Filter-Drift (ohne Klarnamen).

### M39 — Versionsnummer im Hamburger-Menü

**Status:** umgesetzt (Code); Frontend-Build.  
**Anzeige:** `Version 2.0 (web)` bzw. nach iOS-Build `Version 2.0 (29)` via Env.  
**Dateien:** `appVersion.ts`, `AppFooterMenu.tsx`, `.env.production` / example.

### M40 — Hausregel: Spalten-Pool-Boni (oben / unten / Kombi)

**Status:** umgesetzt (Code); **Backend-Deploy + Migration** nötig.  
**Freigabe 2026-07-31:** Erster Spieler; Bonus Pflicht; 7 untere Felder; nur Strategy; Labs+Flag; `ruleUpperRace` parallel; C gleiche Spalte.  
**Migration:** `20260731120000_column_pool_bonuses`

### M41 — 2×/3× Alle Fünfe nur bei Score 50

**Status:** umgesetzt (Code); Backend-Deploy nötig für Auto-Regeln live.  
**Ist-Fix:** `isFastYatzy` verlangt `score === 50`; Tests Backend+Frontend; Info-Texte angepasst.  
**Soll:** Nur echte Alle-Fünfe-Treffer (50) zählen; 3× hintereinander → Gegner-Pool 0.

### M36 — Hausregeln öffentlich & Session-Toggles

**Status:** geplant; **GO nach M30** (App Store Release). **Teilfortschritt:** Session-Flags (`ruleYatzyStreak2`, `ruleYatzyTriple`, `ruleUpperRace`) und Host-Übernahme beim Raum-Erstellen sind bereits in HEAD; Labor-PIN und öffentliche Multi-UI fehlen noch.

**Problem heute:** Hausregeln hängen am Labor (`NEXT_PUBLIC_LABS_PIN` + `localStorage` pro Gerät). Im Multi sieht nur wer den Code eingegeben hat die UI — Backend unterstützt Session-Flags bereits teilweise.

**Ziel:** Freier Einstellungsbereich; **Host wählt Regeln für die Session** (wie Gegner-Pool / Pool-Endspiel); alle Spieler sehen dieselben Toggles im Spiel. Solo weiter über `uiPrefs`.

**Sprints:** 36.1 Backend Session-Flags (teilweise erledigt) · 36.2 Einstellungen + Multi-Setup · 36.3 Spiel-UI koppeln.

Details: `docs/milestone-roadmap-analysis.md` → Abschnitt **M36**.

## Letzte Abgeschlossene Milestones

### Hausregeln Auto, Statistik lokal, Feldeintrag-Perf 2026-07-31

**Status:** implementiert (HEAD `f5a2665`); Frontend Unit-Tests 55 grün; Backend-Deploy/Migration ggf. noch prüfen; iOS Build 29 ausstehend.

- **Auto-Hausregeln** (2 Spieler, Strategy): 2× Alle Fünfe → Pool halbieren; 3× → Pool 0; Oberer Bereich zuerst → Rivalen-offene Oberfelder als Pool; Overlays.
- **Labs-Toggles + Info-„i“**; Session-Flags vom Host; Visuelle-Einblendungen-Info.
- **Fortschritt 25/50/75 %:** Punktdifferenz nur eingetragene Feld-Scores (ohne +35 / Extra-Yatzy).
- **Statistik:** „Das bin ich“ / Aliase; Paarungen lokal ausblenden (`hiddenPairings`); Baseline ohne Admin-Key.
- **Performance:** schneller `completeField`, Lobby `?lite=1`, Overlay vor Lobby-Wait.

Dateien: `houseRules.ts`, `houseRulesService.ts`, `runProgressFeedback.ts`, `hiddenPairings.ts`, `playField.ts`, `sessionService.ts`, Migration `20260725120000_house_rule_toggles_and_triple`

**Hinweis Tests:** 3 Backend-Tests zu Admin-Auth Baseline erwarten noch den alten Admin-Key-Zwang — anpassen, wenn Stats-Auth-Suite angefasst wird.

### UX Politur II — Navigation, Einstellungen, Statistik, Abschluss 2026-06-15

**Status:** implementiert; Web/Server-Frontend gebaut; iOS noch auf Build 28.

- **Hamburger-Menü:** Seiten-Sheet von rechts, Würfel-Branding, gestaffelte Karten, animiertes Icon.
- **Startscreen:** Würfel skalieren bei offener Bilanz (`home-cinematic--stats-open`).
- **Einstellungen:** Perlgrau/Slate, Accordion-Bereiche, Toggles Grün/Rot.
- **Statistik:** Paarungen als Accordion auf `/stats`; lazy Detail-Load; Redirect von `/stats/pairing`; Badge „Top-Rivalität“ zentriert.
- **Spielabschluss:** „Zettel ansehen“ / „Spielanalyse“ als dunkle Karten (`.run-finish-action-btn`).

Dateien: `AppFooterMenu.tsx`, `HomeBentoGridCinematic.tsx`, `app/settings/page.tsx`, `SettingsSection.tsx`, `PairingAccordionItem.tsx`, `PairingDetailPanel.tsx`, `app/stats/page.tsx`, `RunFinishScreen.tsx`, `globals.css`

### UX Politur Einstellungen / Statistik / Analyse 2026-06-15

**Status:** implementiert; Web/Server-Frontend gebaut (HEAD `04ab018`); iOS noch auf Build 28.

- **Einstellungen Ein-Screen:** Alle Toggles + Solo/Multi-Start; Labs/Feedback leiten um; iPad-Namen leer lassen.
- **Statistik Stufe A+B:** `StatsHeroPanel`, Badges, Duellbalken, Sortierung.
- **Spielanalyse:** Kern „Warum verloren?“; Details eingeklappt; Graph alle 10 %.
- **Fortschritt 25/50/75 %:** vorn/zurück/gleichauf; manuell wegklickbar.
- **Screenshot:** Footer-Button „Bild“, Vorschau, Toast.
- **Startscreen:** Würfel größer, ohne Puls-Ring.

Dateien: `app/settings/page.tsx`, `StatsHeroPanel.tsx`, `MatchAnalysisView.tsx`, `ScoreProgressionChart.tsx`, `RunProgressOverlay.tsx`, `AppLegalFooter.tsx`, `HomeBentoGridCinematic.tsx`, `lib/statsOverview.ts`, `lib/scoreProgressionChart.ts`, `lib/runProgressFeedback.ts`

### Hausregeln Strategy (Feature-Labor) 2026-06-15

**Status:** implementiert; Backend Prod deployed; Web-Frontend gebaut; iOS noch auf Build 28.

- **Brennt:** −1 Pool vor Eintrag (leeres Feld); Button im Wurf-Overlay (`ScoreEntryPanel`).
- **Wurf verkaufen / 2× / 3× Alle Fünfe / Oberer Bereich:** Zusatzregeln — Popover rechts am Zettel oder eingeklappt im Overlay (`HouseRulesTableActions`); Auto-Regeln im Duell bei Session-Flags.
- **iPad-Tischmodus:** Hausregeln in `TableModePlayBoard` (seit `1457a2f`).
- Aktivierung: Entwickler-Vorschau (`NEXT_PUBLIC_LABS_PIN`, Code auf `/settings` → Hausregeln-Toggles); Labor pro Gerät.

Dateien: `backend/src/domain/houseRules.ts`, `houseRulesService.ts`, `frontend/lib/houseRules.ts`, `HouseRulesTableActions.tsx`, `HouseRulesPanel.tsx`, `ScoreEntryPanel.tsx`, `TableModePlayBoard.tsx`, `RollSaleOverlay.tsx`

### Feature-Labor (Entwickler-Vorschau) 2026-06-14

**Status:** abgenommen (`5e621ac`).

- Code-Freischaltung auf `/settings` (Route `/settings/labs` leitet um), `featureFlags.ts` für schrittweisen Feature-Rollout.

Dateien: `labsAccess.ts`, `LabsUnlockDialog.tsx`, `app/settings/labs/page.tsx`

### Bugfix Multi Alle Fünfe / Strategy-Würfe 2026-06-11

**Status:** abgenommen (`e198293`); Prod deployed.

- Kein fixes 20-Wuerfe-Limit pro Feld mehr (Backend + Frontend + Solo lokal).
- Grenzen nur noch: Pool + Gesamtbudget (`Spielanzahl × 39`).
- Wurf-Chips bis `rollsRemaining`; Hinweis wenn bei Alle Fünfe (50) kein Wuerfel 1–6 gewaehlt.
- Fehler statt stillem `return` bei ungueltigem Eintrag.

Dateien: `backend/src/domain/gameRules.ts`, `backend/src/services/playField.ts`, `frontend/lib/gameRules.ts`, `frontend/lib/gameRules.test.ts`, `frontend/lib/localSoloRun.ts`, `ScoreEntryPanel.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`

### M29 Technische Schulden & Security 2026-06-11

**Status:** abgenommen (`706d509`); Server- und Mac-Tests gruen.

- `rebuildLeagueStandings` nach Stats-Reset (`resetPairings`).
- Match-Analyse: `GET .../match-analysis` erfordert `X-Player-Secret` oder Session `FINISHED`.
- Next.js 15.5.19; Backend `npm audit fix` (0 Findings); postcss moderate transitiv dokumentiert.

Dateien: `backend/src/services/pairingStats.ts`, `backend/src/routes/sessions.ts`, `frontend/lib/api.ts`, `frontend/package.json`, `CHANGELOG.md`

### M27 Frontend-Tests & Stabilität 2026-06-11

**Status:** abgenommen (`4d81f50`); Mac E2E 3/3 nach `npm install`.

- Playwright Smoke-Tests (`e2e/`, `npm run test:e2e`): Solo, Multi-Join, Home `/app`.
- `AppErrorBoundary` fuer `/app`, `/play`, `/stats`.
- Unit-Tests: `gameScoring`, `pairingMerge`, `localSoloRun` (`npm run test`).

Dateien: `frontend/e2e/`, `frontend/components/AppErrorBoundary.tsx`, `frontend/lib/gameScoring.test.ts`, `frontend/lib/pairingMerge.test.ts`, `frontend/lib/localSoloRun.test.ts`

### UX Startscreen Cinematic Editorial 2026-06-11

**Status:** erledigt im Produktcode (`d8b5952`); Web/Server-Frontend gebaut; iOS TestFlight **`2.0 (28)`** (Upload 2026-06-11).

- **Cinematic Editorial:** Gestapelte Poster-Kacheln Multi/Solo; große Modus-Typo; Mini-Chip; Würfel-Bühne rechts; integrierte Glas-CTA links.
- **Bilanz:** Kompakter Chip oben, Stats aufklappbar (kein permanenter Hero).
- **Rollback:** `HomeBentoGridClassic` per `NEXT_PUBLIC_HOME_LAYOUT=classic`, `set-home-layout.sh` oder `localStorage dicebudget.homeLayout`.

Dateien: `HomeBentoGridCinematic.tsx`, `HomeBentoGridClassic.tsx`, `HomeBentoGrid.tsx`, `HomeHeroBanner.tsx`, `lib/homeLayout.ts`, `lib/useHomeHeroData.ts`, `globals.css`, `infra/scripts/set-home-layout.sh`

### UX Startscreen-Arena + Footer-Menü + Branding 2026-06-10

**Status:** erledigt im Produktcode (`66e8487`); Web/Server-Frontend gebaut; iOS TestFlight in **`2.0 (27)`** (nicht 26 — Pull/`build:ios` fehlte dort).

- **Startscreen Arena:** Zwei Kacheln Multi/Solo, **ohne** Mittel-Logo; zentrierte Texte/Badges; dominante 3D-Würfel-Icons; Aurora/Glow.
- **Footer:** `Home · Statistik · Einstellungen · Menü` — Hamburger dezent, Menü Glas-Morph; Screenshot, Support, Legal, bottle-trade.de.
- **Branding:** DiceBudget-Logo im Intro-Splash; Intro-Key v2.
- **Multi:** Code teilen nur Code.
- **Erfolgs-Animationen:** Vollbild.
- **Abschluss/Analyse:** Card-Dashboards.
- **Nginx:** HTML no-cache, `_next/static/` immutable.

Dateien: `HomeBentoGrid.tsx`, `globals.css`, `AppLegalFooter.tsx`, `AppFooterMenu.tsx`, `screenCapture.ts`, `AppIntroSplash.tsx`, `RunFinishScreen.tsx`, `MatchAnalysisView.tsx`, `AchievementOverlay.tsx`, `shareSocial.ts`, `infra/nginx/dicebudget.bottle-trade.de.conf`

### UX-Politur Zettel + Multi-Teilen + Fortschritt + Feedback 2026-06-08

**Status:** erledigt im Produktcode (`66e715a`), Frontend gebaut; TestFlight `2.0 (25)` bzw. naechster Upload `2.0 (26)`.

- **Zettel:** Ergebnis 1/2/Spiel in Feld-Spalte mit gleichen Farben wie Wertespalten (inkl. lesbarer Schrift auf gruen).
- **Multi:** Raum-Code **teilen** (System-Share) statt kopieren.
- **Fortschritt 25/50/75 %:** Kurzes Overlay + Sound; erscheint auch **nach** Erfolgs-Overlays nacheinander (`feedbackOverlayQueue.ts`).
- **Spiel-Feedback granular:** `/settings/feedback` — Animationen, Sounds, Fortschritt einzeln schaltbar.

Dateien: `ScoreSheetTable.tsx`, `globals.css`, `multi/page.tsx`, `shareSocial.ts`, `runProgressFeedback.ts`, `feedbackOverlayQueue.ts`, `RunProgressOverlay.tsx`, `gameFeedbackPrefs.ts`, `settings/feedback/page.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`

### Teilen vereinfacht + Startscreen-Bilanz 2026-06-08

**Status:** erledigt im Produktcode (`de0f8f2`), Frontend gebaut; noch nicht in iOS `2.0 (21)`.

- Teilen **nur** bei Spielende (`RunFinishScreen`) und Startscreen-Bilanz (kompakter Button in Bilanz-Zeile).
- Kein Share in Erfolgs-Overlays, Spielanalyse, iPad-Duell, Paarungs-Detail.
- Ein **Teilen**-Button → System-Share mit PNG-Karte (Fallback: Download).

Dateien: `ShareActionBar.tsx`, `shareSocial.ts`, `HomeBentoGrid.tsx`, `RunFinishScreen.tsx`

### Spielanalyse Punkte-Duell + Gaming-Feedback II 2026-06-08

**Status:** erledigt im Produktcode (`f2d061c`), Frontend gebaut; **Backend-Deploy** fuer `scoreProgression` durch Nutzer; noch nicht in iOS `2.0 (21)`.

- **Punkte-Duell:** SVG-Graph Spieler 1 vs. 2 in Multi-Spielanalyse.
- **Gaming-Feedback II:** Aurora, Schockwellen, typ-spezifische Partikel; reichere Sounds; kein Share in Overlays.

Dateien: `backend/src/domain/scoreProgression.ts`, `ScoreProgressionChart.tsx`, `AchievementOverlay.tsx`, `achievementSound.ts`

### Erfolg teilen + Alle-Fünfe-Branding 2026-06-08

**Status:** erledigt im Produktcode (`5f90ad8`); Teilen-Scope seit `9f120f5`/`de0f8f2` auf Spielende + Bilanz reduziert; Frontend gebaut; noch nicht in iOS `2.0 (21)`.

- **Teilen (Canvas-Karte):** nur Spielende + Startscreen-Bilanz.
- **Alle Fünfe (UI):** Nutzer-sichtbare Texte statt „Yatzy“; technische IDs unveraendert.

Technische Hinweise:

- `frontend/lib/matchResultShare.ts`, `shareCanvasUtils.ts`, `ShareActionBar.tsx`
- `frontend/lib/labels.ts` (`KNIFFEL: "Alle Fünfe"`)
- Backend: `matchCoaching.ts`, `matchAnalysis.ts`, `playField.ts`, `extraYatzyDieValues.ts`

### Spiel-Feedback Gaming-Politur 2026-06-08

**Status:** erledigt im Produktcode (`a93e462`), Frontend gebaut; noch nicht in iOS `2.0 (21)`.

- Dunkle Gaming-Overlays (Glas-Karte, typ-spezifische Szenen: obere Sektion, Ring, Combo, Alle-Fünfe-Shake/Flash).
- Layered Web-Audio mit Riser, Kicks, Stereo-Panning, Noise-Bursts.

Dateien: `AchievementOverlay.tsx`, `achievementSound.ts`, `globals.css`

### Spielanalyse-Coaching + Spiel-Feedback 2026-06-08

**Status:** erledigt im Produktcode (`3c03592`), Frontend gebaut; Backend-Deploy durch Nutzer fuer Multi-Coaching in API; noch nicht in iOS `2.0 (21)`.

- **Coaching:** Narrative (Sieg/Niederlage), Stärken/Schwächen, Pool-Report (Strategy), Feld-Differenzen, bis zu 3 Tipps; UI-Sektionen im dunklen Dashboard-Look.
- **Spiel-Feedback (Basis):** Erfolgs-Overlays + synthetische Sounds bei Bonus, unterer Spalte voll, Große Straße, Alle Fünfe; Toggle „Spiel-Feedback“.
- **Einstellungen:** Rücknavigation von Solo/Multi mit `?from=solo|multi`.

Technische Hinweise:

- `backend/src/domain/matchCoaching.ts`; API `coaching` in `GET /sessions/invite/:code/match-analysis`
- `frontend/components/MatchAnalysisView.tsx`, `frontend/lib/matchCoaching.ts`
- `frontend/components/AchievementOverlay.tsx`, `frontend/lib/achievementFeedback.ts`, `frontend/lib/achievementSound.ts`
- `frontend/lib/settingsReturn.ts`

### Alle-Fünfe-Markierung und Zusatz-Alle-Fünfe 2026-06-08

**Status:** erledigt im Produktcode (`cb101f6`), Frontend gebaut; Backend-Deploy durch Nutzer (Migration `extra_yatzy_die_values`); noch nicht in iOS `2.0 (21)`.

- Alle-Fünfe-Eintrag (50 Pkt.): Würfelwahl 1–6; Markierung als **Mini-Würfel** (50 % Feldhöhe) neben dem passenden Feld-Würfel.
- Ab 6. Alle Fünfe gleicher Augenzahl: **Umbruch** (Grid max. 5 pro Zeile), Label-Spalte mit `overflow: hidden`.
- **Zusatz-Alle-Fünfe (+100):** Plus-Button bei Alle Fünfe → Würfelwahl → Bonus; Augenzahl in `games.extra_yatzy_die_values` (JSON), erscheint in der Markierung.
- Popover-Auswahl per Portal (`ExtraYatzyPickerOverlay`) — nicht mehr vom Zettel abgeschnitten.

Technische Hinweise:

- Migration `20260608120000_extra_yatzy_die_values`
- `POST /runs/:id/extra-yatzy` Body `{ yatzyDieValue: 1–6 }` (Pflicht)
- `DiceFace` Groessen `field` / `mini`; `YatzyDiePicker` gemeinsam fuer Eintrag und Zusatz-Yatzy
- Solo: `incrementLocalSoloExtraYatzy(runId, yatzyDieValue)` lokal

Dateien:

- `frontend/components/ScoreSheetTable.tsx`, `DiceFace.tsx`, `YatzyDiePicker.tsx`, `ExtraYatzyPickerOverlay.tsx`
- `frontend/components/ScoreEntryPanel.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`
- `frontend/lib/localSoloRun.ts`, `frontend/app/globals.css`
- `backend/src/services/playField.ts`, `backend/src/routes/runs.ts`, `backend/src/domain/extraYatzyDieValues.ts`
- `backend/src/services/getRun.ts`, `backend/prisma/schema.prisma`

### Spielanalyse 2026-06-06

**Status:** erledigt im Produktcode (`d00059f`), Frontend gebaut; in TestFlight `2.0 (21)`.

- Nach Multi/Solo-Abschluss optional **Spielanalyse** (Button auf `RunFinishScreen`, nicht automatisch).
- Verfuegbar nach Pool-Endspiel bzw. direkt wenn kein Pool-Endspiel.
- **2 Spieler:** Head-to-Head mit Attribution (Bonus, oben/unten, Zusatz-Alle-Fünfe), Insights, Gegner-Metriken.
- **3–6 Spieler:** Runden-Ranking, Platz/Abstand zur Spitze, Direktbilanz, aufklappbare Direktvergleiche je Mitspieler.
- **Solo:** lokale Eigenanalyse aus `RunDto`.
- **Historie:** `/stats/pairing` → App-Runde antippen → `/stats/match-analysis?invite=…`.
- Keine neue DB-Migration; Berechnung on-demand aus Runs/Feldern.

Technische Hinweise:

- `GET /sessions/invite/:code/match-analysis?viewerPlayerId=…`
- Domain `backend/src/domain/matchAnalysis.ts` (Tests in `matchAnalysis.test.ts`)
- UI: `MatchAnalysisView.tsx`, `globals.css` (`.match-analysis-*`)

Dateien:

- `backend/src/services/matchAnalysisService.ts`, `backend/src/routes/sessions.ts`
- `frontend/components/MatchAnalysisView.tsx`, `RunFinishScreen.tsx`, `PlayBoard.tsx`
- `frontend/app/stats/match-analysis/page.tsx`, `frontend/app/stats/pairing/page.tsx`
- `frontend/lib/matchAnalysisTypes.ts`, `frontend/lib/api.ts` (`getSessionMatchAnalysis`)

### Spiel-UX-Politur 2026-06-05

**Status:** erledigt und Web/Backend deployed, in TestFlight `2.0 (21)`.

- Spielzettel: Ergebnis 1 und Ergebnis 2 mit dunklem Hintergrund wie der restliche Zettel.
- Multiplayer: Switch „Werten“ / „Nicht werten“ (Settings-Design) auf Abschluss-Screen; Paarungs-Statistik erst nach `POST /sessions/invite/:code/finalize-stats` beim Verlassen.
- Alle Fünfe: Wuerfel-Abfrage (1–6) bei 50 Punkten; Markierung als Mini-Wuerfel auf dem Zettel (`yatzy_die_value`; erweitert in Alle-Fünfe-Milestone 2026-06-08).
- Toggles app-weit blassgruen/blassrot (`.app-toggle`).
- Startscreen-3D-Icons ca. +75 % (CSS).
- `/settings` gruppiert (Allgemein, Solo, Multi, iPad); iPad-Namen nur bei aktivem Tischmodus editierbar.
- **Fix Abschluss-Fehler:** Einzelspieler in Multi-Räumen; `SessionNotReadyError` → 409 statt 500; Fehlertext auf Abschluss-Screen.

Technische Hinweise:

- Migration `20260605120000_pairing_stats_yatzy_die`.
- `loadFinishedSessions` filtert `includeInPairingStats: true`.
- `finalizeSessionStats`: Paarungs-Statistik nur bei `players.length >= 2`; sonst Session trotzdem schließbar.
- `SessionNotReadyError` mit Gründen: Pool-Endspiel offen, Mitspieler nicht fertig, keine Spieler.
- Bekanntes UX-Thema: Nach Pool-Endspiel muessen Nicht-Sieger ggf. „Aktualisieren“ tippen, bevor der Abschluss-Toggle erscheint.

Dateien:

- `frontend/components/StatsRatingToggle.tsx`, `RunFinishScreen.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`
- `frontend/components/ScoreEntryPanel.tsx`, `ScoreSheetTable.tsx`, `frontend/app/settings/page.tsx`
- `backend/src/services/sessionService.ts`, `backend/src/routes/sessions.ts`, `backend/src/services/playField.ts`
- `backend/src/middleware/errorHandler.ts`
- `frontend/app/globals.css`, `CHANGELOG.md`

### M34 - Bugfixes + Stats-Reset

**Status:** erledigt und Web/Backend deployed, in TestFlight `2.0 (21)`.

- Bonus-Konfetti im Bonus-Overlay.
- Support-Link im Start-Footer.
- Gegner-Pool laedt bei App-Rueckkehr und per Aktualisieren-Tap nach, weiterhin ohne Polling.
- Pool-Endspiel ist auch dann erreichbar, wenn der Pool-Sieger seinen Run vor den Mitspielern beendet.
- Stats-Alias-Merge fuehrt gleiche lokale Aliase reihenfolgeunabhaengig zusammen.
- Serverseitiges Zuruecksetzen von Paarungen ueber `POST /stats/pairings/reset`.
- Capacitor-Fix: Paarungs-Detail nutzt `next/link`, damit die App nicht zum Start zurueckspringt.

Technische Hinweise:

- Reset-Endpunkt ist destruktiv, ohne Auth und wirkt auf alle Geraete.
- `LeagueStanding` wird durch Reset nicht rueckwirkend neu berechnet.

### M35 - Paarungen Bearbeiten

**Status:** erledigt und Web/Backend deployed, in TestFlight `2.0 (21)`.

- Auf `/stats/pairing` koennen Siege je Spieler und eine Netto-Punktedifferenz nachgetragen werden.
- Statistik zeigt App-Runden und manuelle Werte als eine kombinierte Gesamtuebersicht.
- `pairing_manual_baselines` wurde reaktiviert, ohne neue Migration.
- Neuer Endpunkt: `POST /stats/pairings/baseline`.
- `buildBaselineWrites()` in `frontend/lib/pairingMerge.ts` uebersetzt Gesamtwerte in Baseline-Writes.

Technische Hinweise:

- Baseline-Endpunkt ist ohne Auth und wirkt auf alle Geraete.
- Beim Statistik-Zuruecksetzen werden zugehoerige Baselines mit geloescht.

### UI-Politur 2026-06-01

**Status:** erledigt und Web deployed, in TestFlight `2.0 (21)`.

- Gewaehlter Punktwert im Eintrags-Overlay ist gelb gefuellt.
- Spielzettel fuellt die volle Bildschirmhoehe.
- Ergebnis-Zeilen sind nur moderat hoeher als Eintragsfelder.
- `Ergebnis 1` hebt Hauptwert und Bonus-Delta (`+/-`) deutlicher hervor.

Dateien:

- `frontend/app/globals.css`
- `frontend/components/FitScoreSheet.tsx`
- `frontend/components/ScoreSheetTable.tsx`

### iPad-Tischmodus 2026-06-02

**Status:** erledigt und Web deployed, in TestFlight `2.0 (21)`.

- Host-Option auf `/multi`: `iPad-Tischmodus`.
- Erstellt ein 2-Spieler-Spiel auf einem iPad und oeffnet `/play?table=1&invite=...`.
- Zwei Zettel werden im iPad-Querformat nebeneinander angezeigt und sind beide antippbar.
- Spielernamen fuer links/rechts sind beim Erstellen eingebbar.
- Technische `playerId`s sind gueltige UUIDs; Namen werden lokal als Aliase gespeichert und fuer Anzeige/Statistik-Zuordnung genutzt.
- Gegner-Pool sichtbar und Pool-Endspiel bleiben im Tischmodus waehlbar.
- Pool-Endspiel wird im Zwei-Zettel-Screen aufgeloest.
- Kein Backend-Schema und keine neue Migration.

Dateien:

- `frontend/app/multi/page.tsx`
- `frontend/app/play/page.tsx`
- `frontend/components/TableModePlayBoard.tsx`
- `frontend/lib/tableMode.ts`
- `frontend/lib/activeGame.ts`
- `frontend/app/globals.css`

### Game-Dashboard-Design 2026-06-03

**Status:** erledigt und Frontend gebaut, in TestFlight `2.0 (21)`.

- Startscreen wirkt als modernes Game-Dashboard mit dunklem Premium-/Strategiespiel-Look.
- Aktuelle Startscreen-Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`; `Raum beitreten` ist in `/multi` integriert.
- Jede Hauptfunktion hat eine eigene Farbwelt; die Startscreen-Karten nutzen 3D-PNG-Icons aus `frontend/public/home-icons/`.
- `/solo`, `/multi` und `/multi/join` wurden visuell an den Startscreen angepasst; Formularlogik, Routen und API-Aufrufe bleiben unveraendert.
- Der eigentliche Spielzettel zum Eintragen wurde bewusst nicht umgestaltet.
- Startscreen zeigt `Paarungs-Spiele` aus `/stats/pairings` statt globaler App-Runs.
- Startscreen-Bilanz ersetzt den alten Platzhalter-Fortschrittsbalken: gewonnen/verloren aus lokal zusammengefuehrten Paarungsdaten, inkl. Fallback auf lokal benannte Statistikspieler.
- iOS-Scrollport-Fix bestaetigt: Startscreen nutzt internen `100dvh`-Scrollport (`home-screen`) statt Body-Scroll; `html/body` konkurrieren nicht mehr. Home-Main blockiert Scrollen nicht mehr. Spielzettel/Play-Screens bleiben starr.
- Startscreen-Ueberarbeitung: feste Dashboard-Flaeche ohne Scrollbereich, vier Hauptkarten (`Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`), Footer als letztes Element. `Raum beitreten` ist in `/multi` integriert. Zentrale `/settings`-Seite verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Farbwelt ruhiger: Dunkelblau, Anthrazit, Petrol, Gold/Kupfer statt Neon/Pink/Lila/Cyan.
- Multiplayer-Abschluss: Nach dem letzten Feldeintrag wird der Run automatisch abgeschlossen. Ohne Pool-Endspiel erscheint direkt das Ergebnis mit `Spiel beenden und zur Startseite` + `Zettel ansehen`; in der Zettelansicht bleibt nur der Startseiten-Button. Abschluss-Screens verlinken nicht mehr zu Statistik/Lobby/Rangliste.
- App-weite Footer-/Legal-Finalisierung: Home-, Setup-, Stats-, Settings- und Legal-Screens nutzen unten eine dunkle Bottom-Tabbar mit vier gleich breiten Bereichen (`Home`, `Datenschutz`, `Impressum`, `Support`) und SVG-Line-Icons. Der Footer nutzt bewusst kein `safe-area-inset-bottom`, weil iOS dadurch Links sichtbar nach oben schiebt. `/play` rendert bewusst keinen Footer, damit Solo-, Multiplayer- und Tischmodus-Zettel die volle Screenhoehe nutzen.
- Datenschutz und Impressum nutzen jetzt dieselbe App-Aufteilung wie die übrigen Screens: dunkler Hintergrund, `AppScreenHeader`, scrollender Contentbereich und Footer-Tabbar.

Dateien:

- `frontend/components/HomeBentoGrid.tsx`
- `frontend/public/home-icons/*.png`
- `frontend/components/HomeScreenShell.tsx`
- `frontend/components/FixedScreenShell.tsx`
- `frontend/components/AppLegalFooter.tsx`
- `frontend/components/LegalScrollShell.tsx`
- `frontend/components/AppScreenHeader.tsx`
- `frontend/app/app/page.tsx`
- `frontend/app/datenschutz/page.tsx`
- `frontend/app/impressum/page.tsx`
- `frontend/app/multi/join/page.tsx`
- `frontend/app/settings/page.tsx`
- `frontend/app/settings/layout.tsx`
- `frontend/components/GameSetup.tsx`
- `frontend/lib/uiPrefs.ts`
- `frontend/app/globals.css`

## Offene Aufgaben

1. **Prod-Backend-Deploy** Bugfix `e198293`: `sudo bash infra/scripts/deploy-backend-prod.sh` (vom Projektroot).
2. Manueller Multi-Test: Alle Fünfe (50) ab Wurf 23 mit Wuerfelwahl.
3. **M30** TestFlight-Regression auf HEAD; iOS-Upload naechste Build-Nummer.
4. App Store Connect: Paid Applications Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.
5. Optional: Auto-Refresh nach Pool-Endspiel fuer Statistik-Toggle.
6. Optional: `milestone-22-prep` nach Nutzer-Freigabe auf `main` bringen.

## Bekannte Technische Schulden

- Stats-Endpunkte sind durch `X-Admin-Key` geschuetzt (M23); Key nur in Env, kein UI-Prompt.
- Frontend transitive `postcss` moderate (via Next.js) — kein sicherer Fix ohne Next-Major.
- E2E-Abdeckung noch duenn (3 Smoke-Tests); iPad-Tischmodus und iOS-Scroll nicht abgedeckt.
- Admin-UI fuer manuelle Paarungs-Baselines fehlt.

## Aktuelle Prioritaeten

1. Prod-Backend-Deploy + Multi-Regression Bugfix `e198293`.
2. **M30** TestFlight-Regression und App Store Connect.
3. iOS-Build auf HEAD; Release-Submit.

## Wichtige Dateien Fuer Aktuelle Arbeit

- `AGENT_RULES.md`
- `HANDOVER.md`
- `docs/ios_current.md`
- `docs/decisions.md`
- `frontend/lib/gameRules.ts`, `frontend/lib/gameRules.test.ts`
- `frontend/e2e/`, `frontend/components/AppErrorBoundary.tsx`
- `frontend/lib/shareCanvasUtils.ts`, `frontend/lib/achievementShare.ts`, `frontend/lib/matchResultShare.ts`
- `frontend/components/RunProgressOverlay.tsx`, `frontend/app/settings/feedback/page.tsx`
- `frontend/components/ShareActionBar.tsx`, `frontend/components/AchievementShareBar.tsx`
- `frontend/lib/labels.ts`
- `frontend/components/MatchAnalysisView.tsx`
- `backend/src/domain/matchAnalysis.ts`
- `backend/src/services/matchAnalysisService.ts`
- `frontend/components/StatsRatingToggle.tsx`
- `backend/src/services/sessionService.ts`
- `backend/src/routes/sessions.ts`
- `backend/src/services/playField.ts`
- `frontend/components/RunFinishScreen.tsx`
- `frontend/components/PlayBoard.tsx`
- `frontend/components/ScoreEntryPanel.tsx`
- `frontend/components/FieldScoreChoiceGrid.tsx`
- `frontend/components/ScoreSheetTable.tsx`
- `frontend/components/DiceFace.tsx`
- `frontend/components/YatzyDiePicker.tsx`
- `frontend/components/ExtraYatzyPickerOverlay.tsx`
- `frontend/components/FitScoreSheet.tsx`
- `frontend/components/TableModePlayBoard.tsx`
- `frontend/components/HomeBentoGrid.tsx`
- `frontend/public/home-icons/*.png`
- `frontend/components/HomeScreenShell.tsx`
- `frontend/components/FixedScreenShell.tsx`
- `frontend/components/AppLegalFooter.tsx`
- `frontend/components/LegalScrollShell.tsx`
- `frontend/components/AppScreenHeader.tsx`
- `frontend/app/app/page.tsx`
- `frontend/app/datenschutz/page.tsx`
- `frontend/app/impressum/page.tsx`
- `frontend/app/multi/join/page.tsx`
- `frontend/components/PairingEditOverlay.tsx`
- `frontend/components/PairingSummaryCard.tsx`
- `frontend/lib/pairingMerge.ts`
- `frontend/lib/api.ts`
- `frontend/lib/tableMode.ts`
- `frontend/lib/activeGame.ts`
- `backend/src/services/pairingStats.ts`
- `backend/src/routes/stats.ts`
