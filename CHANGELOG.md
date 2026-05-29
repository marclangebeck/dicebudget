# Changelog

Alle relevanten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

### Added
- **iOS (Capacitor):** `frontend/ios/`, `capacitor.config.ts`, `npm run build:ios`, Doku `docs/ios-app-store.md`
- Bundle ID `de.bottletrade.dicebudget`, nativer API-Zugriff, App-Start direkt `/app`
- **Domain & Marke:** `dicebudget.bottle-trade.de`, App-Name **dice.budget**, Landing `/`, Spiel `/app`, Datenschutz `/datenschutz`
- **Nginx:** nur `dicebudget.bottle-trade.de` (kniffel-Domain aus DNS und Config entfernt)
- **UI-Modernisierung (Milestone 20):** Bento-Startscreen, einheitliche Screen-Header, überarbeiteter Spielzettel
- **Startscreen:** `HomeBentoGrid` — große Kachel „Raum erstellen“, Einzelspiel, Statistik, Code-Zeile volle Breite unten
- **Statistik-UI:** `AppScreenHeader`, `PairingSummaryCard`, Styles `.stats-*` auf `/stats` und `/stats/pairing`
- **Setup-UI:** `/solo` und `/multi` mit `AppScreenHeader`, `SetupScreenLayout`, `.setup-host-*`
- **Spielzettel-UI:** `PlayTopBar`, Zellen/Panel `.play-*`, fixiertes `ScoreEntryPanel` unten; Zettel skaliert per `FitScoreSheet` **ohne Seiten-Scroll** im aktiven Spiel
- **Paarungsstatistik:** `/stats` mit klickbaren Zweier-Paarungen; Detail `/stats/pairing?key=…` (App-Runden, Siege, Differenz)
- **Manuelle Paarungs-Historie:** `pairing_manual_baselines` (z. B. Spiele vor App-Start)
- **Namen zusammenführen:** `player_name_aliases`, UI `NameMergePanel`, API `/stats/names`
- **Serien / Ligapunkte:** `League`, `LeagueStanding`; Sieger +1 + Differenz-Bonus; „Neue Runde in derselben Serie“
- **Letzten Eintrag löschen:** `scored_sequence`, `POST …/fields/:fieldId/clear`, UI „Eintrag löschen“
- **Frontend:** `normalizePairing.ts`, Fehlerseite `/stats/pairing/error.tsx`, `.env.production` für API-URL
- **Deploy:** getrennte Skripte `deploy-backend-prod.sh`, `deploy-frontend-prod.sh`
- **Milestone 22 Vorbereitung:** `docs/milestone-22-preparation.md` mit Ist-Zustand, Zielmodell (Solo lokal, Multi pseudonym), Migrations- und Bereinigungsentwurf
- **Player-Identität (Frontend):** `frontend/lib/playerIdentity.ts` erzeugt/speichert lokale `playerId` (UUID) und lokale Spieler-Labels
- **M22 Datenbereinigungsmigration:** `backend/prisma/migrations/20260528093000_m22_pseudonymous_cleanup/migration.sql` entfernt Baselines/Aliase und Legacy-Multiplayerdaten mit Klarnamen
- **Lokale Solo-Engine:** `frontend/lib/localSoloRun.ts` (Create/Get/Complete/Clear/Extra-Yatzy/Finish/Abandon in LocalStorage)
- **Lokales Scoring-Modul:** `frontend/lib/gameScoring.ts` (Bonus-/Totalsummen und Extra-Yatzy-Verteilung)
- **Lokale Gegner-Aliase:** `frontend/lib/playerAliases.ts` + Overlay `frontend/components/PlayerAliasOverlay.tsx` (Alias nur lokal auf Gerät)
- **Intro-Splash (M24 A):** schwarzer Eröffnungsscreen mit Branding, Würfeln und Progress 0–100 vor `/app`
- **Impressum:** `/impressum` mit Platzhalter-Anbieterangaben
- **LegalScrollShell:** scrollbarer Container für Datenschutz/Impressum (Capacitor iOS)

### Changed
- Health-Endpoint: `service: dicebudget-backend`
- **Startscreen:** `HomeModeButtons` entfernt — Navigation über Bento-Kacheln und eingebettetes Code-Feld
- **Spielabschluss:** Finish-Ansicht (`RunFinishScreen`) darf scrollen; aktives Spiel bleibt auf einem Screen
- **Milestones:** Milestone 22 um konkrete Startreihenfolge (Tag 1-3) erweitert; Teilschritt 22.1 auf `in Arbeit (Tag 1)` gesetzt
- **Multiplayer-Join:** statt Klarname wird jetzt `playerId` an `/sessions/invite/:code/join` gesendet; Server persistiert Token-Form `pid:<uuid>`
- **Lobby/Ranking DTOs:** liefern `playerId` statt Name; Frontend zeigt lokale Labels (`Du`, `Spieler <Kurz-ID>`)
- **Paarungsstatistik:** aggregiert nur noch pseudonyme `pid:`-Spieler; manuelle Baselines und Alias-Auflösung sind nicht mehr im aktiven Statistikpfad
- **Datenschutzseite:** Multiplayer/Statistik-Abschnitte auf pseudonyme Server-Speicherung aktualisiert
- **Stats-API:** Name-Merge-Endpunkte (`/stats/names`, `/stats/names/merge`) aus aktiven Routen entfernt
- **Solo-Start:** `GameSetup` erstellt lokale Runs statt Server-`POST /runs`
- **PlayBoard:** lokale Solo-Runs werden ohne Backend-Requests gespielt; Multiplayer bleibt serverbasiert
- **Navigation-Buttons (M23):** `Zurück`/`Startseite` als einheitliche moderne Glass-Pill-Buttons (`.app-nav-btn`)
- **Home-Header (M25):** Startseiten-Header breiter/präsenter mit größerem Logo und Hero-Typografie
- **Stats/Lobby Alias-UX:** Stift-Button öffnet Overlay; Anzeigenamen werden lokal pro `playerId` aufgelöst
- **Kachel-Visuals (M26):** Icons bleiben primär; Bento-Kacheln mit subtilen Hintergrund-Akzenten und besserer visueller Tiefe
- **Datenschutz (M27):** Text auf app-zentrierte Nutzung umgestellt; Website als begleitende Info-/Support-Seite beschrieben
- **App-Hintergrund:** dunkler Slate-Verlauf app-weit (`#3d4f63` → `#243447` → `#1a2332`); helle Kacheln behalten dunkle Schrift via CSS-Variablen-Reset
- **Navigation (M23):** `app-nav-btn` mit Icon-Pill; kein doppelter Startseite-Button mehr (`SetupScreenLayout` vs. `AppScreenHeader`)

### Fixed
- **iOS Auswahlscreen `/app`:** Legal-Links im Footer außerhalb des Bento-Grids (nicht abgeschnitten)
- **iOS Navigation:** doppelter `← Startseite`-Button auf Solo/Multi/Statistik entfernt
- **Datenschutz/Impressum iOS:** Scrollen via `LegalScrollShell`; Safe-Area unter Statusleiste
- **Capacitor iOS-Deploy:** `npm run build:ios` vor Xcode zwingend nötig (stale Bundle in `ios/App/App/public/`)
- **Produktions-API-URL:** Build nutzt `NEXT_PUBLIC_API_URL` aus `.env.production` (nicht mehr Fallback `127.0.0.1:3020` auf der Live-Domain)
- **Paarungsnavigation:** Statischer Export — Links zur Detailseite als normales `<a>` (voller Seitenload)
- **iOS-Upload auf Mac (`Copy failed`):** Homebrew-`rsync` deaktivieren (`brew unlink rsync`) → `/usr/bin/rsync`; Xcode mit System-PATH starten

### Docs
- **Dokumentation:** HANDOVER, GOiOS, milestones, iOS-Anleitungen auf Stand TestFlight Build 10 aktualisiert (Mai 2026)

### Removed
- `HomeModeButtons.tsx` (ersetzt durch `HomeBentoGrid`)

---

## [2026-05] – DiceBudget, Tests, Modi

### Added
- **Zusatz-Yatzy:** Ab dem 7. Yatzy je Klick +100 auf „Ergebnis Spiel“ (rotierend Sp1→Sp2→…); API `POST /runs/:id/extra-yatzy`
- **Backend-Tests (M14):** Node `node:test` + `tsx`; `npm test` mit SQLite `prisma/test.db`
- **Server-Validierung Scores:** `assertValidScoreForField` in `fieldScores.ts`; HTTP 400 bei ungültigen Werten
- **Solo-Spielmodus-Toggle:** `StrategyModeToggle` auf `/solo`
- **Spielmodus Strategy vs. Klassisch:** `useStrategyRules` auf Session und Run
- **Run-Abschluss-Overlay**, **`POST /runs/:id/abandon`**, **PWA**, **Resume** (`activeGame.ts`), **Join auf Startseite**

### Changed
- **Branding:** Produktname **DiceBudget**; Zettelzeile „Yatzy“; Icons (`npm run icons`)
- **UI:** Helles Glass-Design; Statistik Startseite zunächst nur bestes Gesamtergebnis (später erweitert um `/stats`)

### Added (Multiplayer MVP)
- **Milestones 8–10:** `GameSession`, Sessions-API, `/multi`, `/multi/join`, Rangliste
- **Milestone 7:** `GET /stats` (Basis)
- **Milestone 6:** `RunFinishScreen`

### Changed (Historie)
- Spiel-UI: Zettel-Tabelle, Eintrags-Overlay, manueller Eintrag `{ score, rollsUsed }`
- Produktion: Nginx `/api/`, systemd Backend, statischer Next-Export

### Added (Milestones 1–5)
- Grundgerüst, Prisma/SQLite, Singleplayer-API, Frontend, Wurf-Pool
- `AGENT_RULES.md`, Deploy-Skripte, Domain kniffel.bottle-trade.de
