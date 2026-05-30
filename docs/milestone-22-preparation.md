# Milestone 22 - Tag 1 Vorbereitung (Datenschutz-Umbau)

Stand: 2026-05-28
Status: Tag 1-3 abgeschlossen und ausgerollt

## 1) Ist-Zustand (gesichert)

### 1.1 Personenbezug im aktuellen Modell

- `players.name` speichert Klarnamen aus dem Multiplayer-Join.
- `league_standings.player_name` speichert Klarnamen fuer Serienwertung.
- `player_name_aliases` speichert Alias -> Klarname.
- `pairing_manual_baselines` enthaelt manuelle Historie (u. a. Marc/Nicole).

### 1.2 Statistik aktuell global (serverweit)

- `GET /stats/pairings` und `GET /stats/pairing` aggregieren alle abgeschlossenen Sessions.
- `pairingStats.ts` addiert zusaetzlich `pairing_manual_baselines`.
- Ergebnis: neue App-Installationen sehen nicht automatisch bei 0.

### 1.3 Betroffene Backend-Dateien (Umbau-relevant)

- `backend/prisma/schema.prisma`
- `backend/src/services/sessionService.ts`
- `backend/src/services/leaguePoints.ts`
- `backend/src/services/pairingStats.ts`
- `backend/src/services/playerNames.ts`
- `backend/src/routes/sessions.ts`
- `backend/src/routes/stats.ts`

### 1.4 Betroffene Frontend-Dateien (Umbau-relevant)

- `frontend/lib/api.ts`
- `frontend/lib/sessionTypes.ts`
- `frontend/app/multi/join/page.tsx`
- `frontend/app/stats/page.tsx`
- `frontend/app/stats/pairing/page.tsx`
- `frontend/components/NameMergePanel.tsx`
- `frontend/app/datenschutz/page.tsx`

## 2) Zielmodell (final fuer Umsetzung)

### 2.1 Solo

- Solo-Spielstaende und Solo-Statistik bleiben lokal auf dem Geraet.
- Keine personenbezogene Solo-Statistikpersistenz auf dem Server.

### 2.2 Multiplayer (pseudonym)

- Jedes Geraet hat eine lokale `playerId` (UUID, dauerhaft lokal gespeichert).
- Join nutzt `playerId` statt Klarname als serverseitige Identitaet.
- Optionaler Anzeigename bleibt lokal pro Geraet und wird nicht serverseitig gespeichert.
- Server speichert nur:
  - pseudonyme Spieler-IDs (`playerIdA`, `playerIdB`)
  - Scores
  - Gewinner/Verlierer
  - Zeitstempel
  - Session/League-Referenzen

### 2.3 Vergleich A vs. B

- Paarungsvergleich wird serverseitig ueber pseudonyme IDs berechnet.
- Lesbare Namen werden in der App nur lokal aufgeloest (`playerId -> Anzeigename`).

## 3) Migrationsentwurf (DB + Datenbereinigung)

## 3.1 Schema-Richtung

- `Player`: neues Feld `publicId` (UUID-String, indexiert).
- `LeagueStanding`: Schluessel von `playerName` auf `playerPublicId` umstellen.
- `PairingManualBaseline`: aus aktivem Statistikpfad entfernen (spaeter loeschbar).
- `PlayerNameAlias`: fuer neues Modell nicht mehr notwendig (Abbau in spaeterem Schritt).

Hinweis: Exakte Prisma-Felder werden bei Umsetzung in einer dedizierten Migration finalisiert.

### 3.2 Datenbereinigung (geplant)

1. Manuelle Baselines entfernen (`pairing_manual_baselines` leeren).
2. Historische Klarnamen-Statistik nicht mehr im aktiven Vergleichspfad verwenden.
3. Bestehende personenbezogene Altwerte in `league_standings` entweder:
   - migrieren auf pseudonyme IDs (wenn sinnvoll), oder
   - fuer Milestone-22-Start zuruecksetzen.

### 3.3 API-Umstellung (geplant)

- `POST /sessions/invite/:code/join` akzeptiert `playerId` (und optional lokalen Anzeigenamen nur fuer Client-UX, nicht persistieren).
- Lobby/Ranking/Pairing-Antworten liefern pseudonyme IDs als stabile Referenz.
- Statistik-Endpunkte liefern keine serverseitigen Klarnamen mehr.

## 4) Risiken und Entscheidungen

- Ohne zentrale Klarname-Speicherung braucht die App lokales Namens-Mapping fuer bekannte Gegner.
- Bei App-Neuinstallation geht lokales Mapping verloren (erwartetes Verhalten, datenschutzfreundlich).
- "Keine Serverdaten" und "geraeteuebergreifender Langzeitvergleich" sind nicht gleichzeitig moeglich.

## 5) Tag-1-Abnahme

Tag 1 gilt als erledigt, wenn:

- Ist-Zustand dokumentiert ist (dieses Dokument).
- Zielmodell fuer Solo + Multi final beschrieben ist.
- Migrations-/Bereinigungsrichtung festgelegt ist.
- Noch keine produktive Logik umgebaut wurde.

## 6) Tag-2 Ergebnis (lokal)

- Multiplayer-Join auf `playerId` statt Klarname umgestellt.
- Server persistiert neue Multiplayer-Spieler als Token `pid:<uuid>`.
- Lobby/Ranking/Pairing liefern pseudonyme IDs; Klarname-Felder sind aus den aktiven Antwortpfaden entfernt.
- Name-Merge-Endpunkte (`/stats/names*`) aus aktiver API entfernt.
- Datenbereinigung als Migration vorbereitet:
  - `backend/prisma/migrations/20260528093000_m22_pseudonymous_cleanup/migration.sql`
  - entfernt manuelle Baselines/Aliase
  - entfernt Legacy-Multiplayer-Historie mit Klarnamen (`name NOT LIKE 'pid:%'`)

## 7) API-Checks (lokal verifiziert)

- Backend-Compile: `cd backend && npm run build` erfolgreich.
- Backend-Tests: `cd backend && npm test` erfolgreich (37/37 gruen).
- Frontend-Compile: `cd frontend && npm run build` erfolgreich.
- Test-Migration gegen Test-DB wurde bei `npm test` angewendet:
  - `20260528093000_m22_pseudonymous_cleanup`
  - nur `prisma/test.db`, nicht Produktion.

### 7.1 Vertragsaenderungen API

- `POST /sessions/invite/:inviteCode/join` erwartet jetzt:
  - `{ "playerId": "<uuid>" }`
  - statt vorher `{ "name": "..." }`
- Session-Antworten liefern im Spielerobjekt:
  - `playerId` statt `name`
- Ranking/Winner liefern:
  - `playerId` statt `name`
- Stats-Routen entfernt:
  - `GET /stats/names`
  - `POST /stats/names/merge`
  - `DELETE /stats/names/merge`

## 8) Release-Plan (Deploy + neues iOS-Build)

1. Backend-Deployment auf Server (inkl. Migration):
   - `sudo bash infra/scripts/deploy-backend-prod.sh`
2. Kurzchecks Produktion:
   - Health: `GET /health`
   - Multiplayer join mit `playerId` pruefen
   - `/stats/pairings` und `/stats/pairing` pruefen
3. Frontend-Deployment:
   - `sudo bash infra/scripts/deploy-frontend-prod.sh`
4. iOS-Build auf Mac:
   - `cd frontend && npm run build:ios`
   - Build-Nummer in Xcode erhoehen
   - Archive -> Upload zu App Store Connect/TestFlight
5. TestFlight Smoke-Test:
   - Join/Lobby/Ranking mit pseudonymen Labels
   - Statistik ohne Klarnamen/Baseline

## 9) Tag-3 Ergebnis (lokal)

- Solo-Run-Logik komplett lokal eingefuehrt:
  - `frontend/lib/localSoloRun.ts`
  - lokale Operationen: create/get/complete/clear/extra-yatzy/finish/abandon
- Gemeinsame Scoring-Logik fuer lokal:
  - `frontend/lib/gameScoring.ts` (Breakdown, Bonus, Extra-Yatzy-Rotation)
- Solo-Setup startet jetzt lokale Runs statt `POST /runs`:
  - `frontend/components/GameSetup.tsx`
- Play-Board nutzt fuer lokale Solo-Runs lokale Datenpfade; Multiplayer bleibt API-basiert:
  - `frontend/components/PlayBoard.tsx`
- Datenschutzseite konkretisiert:
  - Solo-Spielstand lokal
  - Multiplayer pseudonym serverseitig
- Frontend/Backend erfolgreich gebaut, Backend-Tests gruen.

## 10) Rollout-Abschluss

- Backend-Deploy inkl. Migration erfolgreich auf Server.
- Frontend-Deploy erfolgreich auf Server.
- SSL fuer `dicebudget.bottle-trade.de` erfolgreich erstellt und aktiv.
- iOS-Builds bis einschliesslich `1.0 (18)` (M29 Punktwahl-Eintrag, M30 Bonus-Delta, M31 Bonus-Einblendung, M32 Topbar/Gegner-Pool, M33 Pool-Endspiel + Würfe-Standard 3); UI-Fixrunde abgenommen.
- Web-Frontend (dunkler Hintergrund, Legal-Seiten, Navigation) auf Produktion deployed.
- Impressum unter `/impressum` (Platzhalter-Anbieterangaben — vom Nutzer zu ergänzen).

