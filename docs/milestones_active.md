# Aktive Milestones - dice.budget

**Stand:** 2026-06-08  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `cb101f6`  
**Produktiv:** Web/API live unter https://dicebudget.bottle-trade.de

Dieses Dokument ist der kompakte Arbeitsstand fuer Agenten. Aeltere Milestones stehen in `docs/milestones_archive.md`.

## Aktueller Milestone

### Milestone 21 - iOS-App / App Store

**Status:** in Arbeit.

Technische Basis ist erledigt:

- Capacitor 7, iOS-Projekt und Bundle `de.bottletrade.dicebudget` sind vorhanden.
- Native App startet direkt auf `/app`.
- Native API-Basis zeigt auf `https://dicebudget.bottle-trade.de/api`.
- TestFlight ist aktiv, aktueller Build ist `2.0 (21)`.
- Naechster Upload ist `2.0 (22)` und muss **Yatzy-Miniwürfel / Zusatz-Yatzy-Würfelwahl** (`cb101f6`) enthalten.

Offen:

- iOS-Build `2.0 (22)` auf dem Mac bauen und hochladen (Yatzy-UX seit `cb101f6`).
- Startscreen, `/solo`, `/multi`, `/settings`, `/stats`, `/datenschutz`, `/impressum` und `/play` in iOS/Capacitor auf iPhone pruefen: Footer-Tabbar muss auf App-/Setup-/Legal-Screens unten sitzen; `/play` muss footerfrei sein und der Zettel muss die volle Screenhoehe nutzen.
- iPad-Tischmodus in TestFlight auf iPad Querformat testen; iPhone-Flow muss unveraendert bleiben.
- TestFlight `2.0 (22)` nach Upload testen (Yatzy-Miniwürfel, Zusatz-Yatzy-Würfelwahl); Regression in `2.0 (21)` (Multi-Statistik-Toggle, Spielanalyse, Footer/`/play`).
- App Store Connect fuer kostenpflichtigen Release fertigstellen.

Details: `docs/ios_current.md`.

## Letzte Abgeschlossene Milestones

### Yatzy-Markierung und Zusatz-Yatzy 2026-06-08

**Status:** erledigt im Produktcode (`cb101f6`), Frontend gebaut; Backend-Deploy durch Nutzer (Migration `extra_yatzy_die_values`); noch nicht in iOS `2.0 (21)`.

- Yatzy-Eintrag (50 Pkt.): Würfelwahl 1–6; Markierung als **Mini-Würfel** (50 % Feldhöhe) neben dem passenden Feld-Würfel.
- Ab 6. Yatzy gleicher Augenzahl: **Umbruch** (Grid max. 5 pro Zeile), Label-Spalte mit `overflow: hidden`.
- **Zusatz-Yatzy (+100):** Plus-Button bei Yatzy → Würfelwahl → Bonus; Augenzahl in `games.extra_yatzy_die_values` (JSON), erscheint in der Markierung.
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
- **2 Spieler:** Head-to-Head mit Attribution (Bonus, oben/unten, Zusatz-Yatzy), Insights, Gegner-Metriken.
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
- Yatzy: Wuerfel-Abfrage (1–6) bei 50 Punkten; Markierung als Mini-Wuerfel auf dem Zettel (`yatzy_die_value`; erweitert in Yatzy-Milestone 2026-06-08).
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

1. **Backend deployen** (Migration `extra_yatzy_die_values`, falls Zusatz-Yatzy live noch fehlschlaegt).
2. iOS/TestFlight `2.0 (22)` bereitstellen (Yatzy-UX seit `cb101f6`).
3. App Store Connect: Paid Applications Agreement, Bank/Steuer.
4. Preis `1,19 EUR`, Screenshots, Beschreibung DE, Datenschutzfragebogen.
5. TestFlight `2.0 (22)`: Yatzy-Miniwürfel, Zusatz-Yatzy-Würfelwahl; Footer/Pool/Multi bereits in `2.0 (21)` regressionsprüfen.
6. Optional: Auto-Refresh nach Pool-Endspiel fuer Statistik-Toggle.
7. Optional: Stats-Reset-/Baseline-Endpunkte auf eigene Paarungen einschraenken.
8. Optional: `milestone-22-prep` nach Nutzer-Freigabe auf `main` bringen.

## Bekannte Technische Schulden

- `POST /stats/pairings/reset` ist destruktiv, ohne Auth und global wirksam.
- `POST /stats/pairings/baseline` ist ohne Auth und global wirksam.
- `LeagueStanding` wird nach Statistik-Reset nicht rueckwirkend neu berechnet.
- Next.js Security-Upgrade ist als spaeteres Thema notiert.
- Frontend-/E2E-Tests fehlen, insbesondere fuer iPad-Tischmodus, neue Game-Dashboard-Optik und iOS-Startscreen-Scroll.
- Admin-UI fuer manuelle Paarungs-Baselines fehlt.

## Aktuelle Prioritaeten

1. Backend deployen (Migration `extra_yatzy_die_values`).
2. iOS/TestFlight `2.0 (22)` bereitstellen (Yatzy-UX seit `cb101f6`).
3. iPad-Tischmodus auf iPad Querformat, neue Start-/Setup-/Lobby-/Settings-/Legal-Optik, Footer-Tabbar in iOS, footerfreie `/play`-Zettel und iPhone-Regression testen.
4. Store-Connect-Freigaben und Metadaten abschliessen.
5. Danach erst optionale Sicherheits-/Auth-Verfeinerung der Stats-Endpunkte planen.

## Wichtige Dateien Fuer Aktuelle Arbeit

- `AGENT_RULES.md`
- `HANDOVER.md`
- `docs/ios_current.md`
- `docs/decisions.md`
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
