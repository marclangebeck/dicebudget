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

### Changed
- Health-Endpoint: `service: dicebudget-backend`
- **Startscreen:** `HomeModeButtons` entfernt — Navigation über Bento-Kacheln und eingebettetes Code-Feld
- **Spielabschluss:** Finish-Ansicht (`RunFinishScreen`) darf scrollen; aktives Spiel bleibt auf einem Screen

### Fixed
- **Produktions-API-URL:** Build nutzt `NEXT_PUBLIC_API_URL` aus `.env.production` (nicht mehr Fallback `127.0.0.1:3020` auf der Live-Domain)
- **Paarungsnavigation:** Statischer Export — Links zur Detailseite als normales `<a>` (voller Seitenload)

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
