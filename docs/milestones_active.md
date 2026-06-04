# Aktive Milestones - dice.budget

**Stand:** 2026-06-04
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `70ad656`
**Produktiv:** Web/API live unter https://dicebudget.bottle-trade.de

Dieses Dokument ist der kompakte Arbeitsstand fuer Agenten. Aeltere Milestones stehen in `docs/milestones_archive.md`.

## Aktueller Milestone

### Milestone 21 - iOS-App / App Store

**Status:** in Arbeit.

Technische Basis ist erledigt:

- Capacitor 7, iOS-Projekt und Bundle `de.bottletrade.dicebudget` sind vorhanden.
- Native App startet direkt auf `/app`.
- Native API-Basis zeigt auf `https://dicebudget.bottle-trade.de/api`.
- TestFlight ist aktiv, aktueller Build ist `2.0 (6)`.
- Naechster Upload ist `2.0 (7)` und muss M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung enthalten.

Offen:

- iOS-Build `2.0 (7)` auf dem Mac bauen und hochladen.
- Startscreen, `/solo`, `/multi`, `/settings` und `/play` in iOS/Capacitor auf iPhone pruefen: Footer muss am unteren Viewport-Rand sitzen; Content darf nur oberhalb davon scrollen.
- iPad-Tischmodus in TestFlight auf iPad Querformat testen; iPhone-Flow muss unveraendert bleiben.
- TestFlight nach Upload erneut testen.
- App Store Connect fuer kostenpflichtigen Release fertigstellen.

Details: `docs/ios_current.md`.

## Letzte Abgeschlossene Milestones

### M34 - Bugfixes + Stats-Reset

**Status:** erledigt und Web/Backend deployed, noch nicht in iOS `2.0 (6)`.

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

**Status:** erledigt und Web/Backend deployed, noch nicht in iOS `2.0 (6)`.

- Auf `/stats/pairing` koennen Siege je Spieler und eine Netto-Punktedifferenz nachgetragen werden.
- Statistik zeigt App-Runden und manuelle Werte als eine kombinierte Gesamtuebersicht.
- `pairing_manual_baselines` wurde reaktiviert, ohne neue Migration.
- Neuer Endpunkt: `POST /stats/pairings/baseline`.
- `buildBaselineWrites()` in `frontend/lib/pairingMerge.ts` uebersetzt Gesamtwerte in Baseline-Writes.

Technische Hinweise:

- Baseline-Endpunkt ist ohne Auth und wirkt auf alle Geraete.
- Beim Statistik-Zuruecksetzen werden zugehoerige Baselines mit geloescht.

### UI-Politur 2026-06-01

**Status:** erledigt und Web deployed, noch nicht in iOS `2.0 (6)`.

- Gewaehlter Punktwert im Eintrags-Overlay ist gelb gefuellt.
- Spielzettel fuellt die volle Bildschirmhoehe.
- Ergebnis-Zeilen sind nur moderat hoeher als Eintragsfelder.
- `Ergebnis 1` hebt Hauptwert und Bonus-Delta (`+/-`) deutlicher hervor.

Dateien:

- `frontend/app/globals.css`
- `frontend/components/FitScoreSheet.tsx`
- `frontend/components/ScoreSheetTable.tsx`

### iPad-Tischmodus 2026-06-02

**Status:** erledigt und Web deployed, noch nicht in iOS `2.0 (6)`.

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

**Status:** erledigt und Frontend gebaut, noch nicht in iOS `2.0 (6)`.

- Startscreen wirkt als modernes Game-Dashboard mit dunklem Premium-/Strategiespiel-Look.
- Aktuelle Startscreen-Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`; `Raum beitreten` ist in `/multi` integriert.
- Jede Hauptfunktion hat eine eigene Farbwelt und eigene SVG-Mini-Poster-Motive.
- `/solo`, `/multi` und `/multi/join` wurden visuell an den Startscreen angepasst; Formularlogik, Routen und API-Aufrufe bleiben unveraendert.
- Der eigentliche Spielzettel zum Eintragen wurde bewusst nicht umgestaltet.
- Startscreen zeigt `Paarungs-Spiele` aus `/stats/pairings` statt globaler App-Runs.
- Startscreen-Bilanz ersetzt den alten Platzhalter-Fortschrittsbalken: gewonnen/verloren aus lokal zusammengefuehrten Paarungsdaten, inkl. Fallback auf lokal benannte Statistikspieler.
- iOS-Scrollport-Fix bestaetigt: Startscreen nutzt internen `100dvh`-Scrollport (`home-screen`) statt Body-Scroll; `html/body` konkurrieren nicht mehr. Home-Main blockiert Scrollen nicht mehr. Spielzettel/Play-Screens bleiben starr.
- Startscreen-Ueberarbeitung: feste Dashboard-Flaeche ohne Scrollbereich, vier Hauptkarten (`Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`), Footer als letztes Element. `Raum beitreten` ist in `/multi` integriert. Zentrale `/settings`-Seite verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Farbwelt ruhiger: Dunkelblau, Anthrazit, Petrol, Gold/Kupfer statt Neon/Pink/Lila/Cyan.
- App-weite Footer-Finalisierung: Home-, Setup- und Play-Shells sind als zweizeiliges Grid aufgebaut (`Content` + fester Footer). Datenschutz/Impressum/Support stehen in einer kompakten Footer-Zeile am unteren Viewport-Rand. Der Footer nutzt bewusst kein `safe-area-inset-bottom`, weil iOS dadurch die Links sichtbar nach oben schiebt; aktuelles Padding: 2px oben und 2px unten. App-Hintergrund ist dunkles Grau.

Dateien:

- `frontend/components/HomeBentoGrid.tsx`
- `frontend/components/HomeScreenShell.tsx`
- `frontend/components/FixedScreenShell.tsx`
- `frontend/components/AppLegalFooter.tsx`
- `frontend/components/AppScreenHeader.tsx`
- `frontend/app/app/page.tsx`
- `frontend/app/multi/join/page.tsx`
- `frontend/app/settings/page.tsx`
- `frontend/app/settings/layout.tsx`
- `frontend/components/GameSetup.tsx`
- `frontend/lib/uiPrefs.ts`
- `frontend/app/globals.css`

## Offene Aufgaben

1. iOS-Build `2.0 (7)` mit M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung hochladen.
2. App Store Connect: Paid Applications Agreement, Bank/Steuer.
3. Preis `1,19 EUR`, Screenshots, Beschreibung DE, Datenschutzfragebogen.
4. TestFlight auf iPhone und iPad pruefen; Footer-Position auf Start-, Setup-, Settings- und Play-Screens explizit testen.
5. Optional: Stats-Reset-/Baseline-Endpunkte auf eigene Paarungen einschraenken.
6. Optional: `milestone-22-prep` nach Nutzer-Freigabe auf `main` bringen.

## Bekannte Technische Schulden

- `POST /stats/pairings/reset` ist destruktiv, ohne Auth und global wirksam.
- `POST /stats/pairings/baseline` ist ohne Auth und global wirksam.
- `LeagueStanding` wird nach Statistik-Reset nicht rueckwirkend neu berechnet.
- Next.js Security-Upgrade ist als spaeteres Thema notiert.
- Frontend-/E2E-Tests fehlen, insbesondere fuer iPad-Tischmodus, neue Game-Dashboard-Optik und iOS-Startscreen-Scroll.
- Admin-UI fuer manuelle Paarungs-Baselines fehlt.

## Aktuelle Prioritaeten

1. iOS/TestFlight `2.0 (7)` bereitstellen.
2. iPad-Tischmodus auf iPad Querformat, neue Start-/Setup-/Lobby-/Settings-Optik, Footer-Position in iOS und iPhone-Regression testen.
3. Store-Connect-Freigaben und Metadaten abschliessen.
4. Danach erst optionale Sicherheits-/Auth-Verfeinerung der Stats-Endpunkte planen.

## Wichtige Dateien Fuer Aktuelle Arbeit

- `AGENT_RULES.md`
- `HANDOVER.md`
- `docs/ios_current.md`
- `docs/decisions.md`
- `frontend/components/PlayBoard.tsx`
- `frontend/components/ScoreEntryPanel.tsx`
- `frontend/components/FieldScoreChoiceGrid.tsx`
- `frontend/components/ScoreSheetTable.tsx`
- `frontend/components/FitScoreSheet.tsx`
- `frontend/components/TableModePlayBoard.tsx`
- `frontend/components/HomeBentoGrid.tsx`
- `frontend/components/HomeScreenShell.tsx`
- `frontend/components/FixedScreenShell.tsx`
- `frontend/components/AppLegalFooter.tsx`
- `frontend/components/AppScreenHeader.tsx`
- `frontend/app/app/page.tsx`
- `frontend/app/multi/join/page.tsx`
- `frontend/components/PairingEditOverlay.tsx`
- `frontend/components/PairingSummaryCard.tsx`
- `frontend/lib/pairingMerge.ts`
- `frontend/lib/api.ts`
- `frontend/lib/tableMode.ts`
- `frontend/lib/activeGame.ts`
- `backend/src/services/pairingStats.ts`
- `backend/src/routes/stats.ts`
