# DiceBudget Strategy Edition – Projektbeschreibung

> **Stand Mai 2026:** Produktname **dice.budget**, Domain `dicebudget.bottle-trade.de`, iOS-App (Capacitor) mit Start `/app`. Multiplayer pseudonym (`playerId`), Solo lokal. Siehe `HANDOVER.md` / `milestones.md` für aktuellen Implementierungsstand.

## 1. Überblick

**DiceBudget Strategy Edition** ist eine strategische Variante von Yatzy/Kniffel.  
Pro Partie werden **1 bis 6 vollständige Spiele** gespielt — die Anzahl legt der Host (Multiplayer) bzw. der Spieler (Singleplayer) **vor Spielbeginn** fest.

Die App unterstützt zwei **Spielmodi**:

| Modus | `useStrategyRules` | Beschreibung |
|--------|-------------------|--------------|
| **DiceBudget Strategy Edition** | `true` (Standard) | Wurf-Pool, Eintrag mit Punkte + Würfe (Limit: 3 + Pool) |
| **DiceBudget Klassisch** | `false` | Kein Pool, kein Gesamtwürfel-Limit; Eintrag nur **Punkte** (Backend: `rollsUsed = 1`) |

- **Singleplayer:** `/solo` → Spielanzahl und Modus → `/play`
- **Multiplayer:** 2–6 Spieler, Einladungscode, optional **Serie** (Liga) über mehrere Runden

**Branding:** Produktname und PWA **DiceBudget**; Zettelzeile **Alle Fünfe** (kein Markenname Kniffel/Yatzy in der UI).

---

## 2. Spielmechanik

### 2.1 Grundstruktur (Strategy Edition)

- **Spielanzahl:** 1–6 (fest vor Start)
- Felder pro Run: `Spielanzahl × 13`
- Pro Feld: bis zu **3 Würfe ohne Pool**; Extra-Würfe (4+) verbrauchen den **Wurf-Pool**
- Nicht genutzte Würfe (bei 1–2 Würfen) → Pool; Hausregeln können Pool zusätzlich ändern
- Backend validiert: Extra-Würfe nur wenn genug Pool — **kein** hartes `×39`-Cap mehr beim Eintrag
- `total_rolls_used` / `rollsRemaining` bleiben als Statistik (Referenz `Spielanzahl × 39`)

| Spielanzahl | Felder | Referenz-Budget (Statistik) |
|-------------|--------|------------------------------|
| 1 | 13 | 39 |
| 3 | 39 | 117 |
| 6 | 78 | 234 |

### 2.2 Klassisches Kniffel

- Kein Wurf-Pool, kein Anzeigen von Pool/Rest
- Pro Feld höchstens 3 Würfe (bei API `recordRoll`); manueller Eintrag ohne Wurf-Auswahl im UI
- Scoring (Bonus 63/35, Spielblock-Summen) **identisch** zur Strategy Edition
- Gesamtergebnis = Summe der Zeilen „Ergebnis Spiel“ aller Spalten

### 2.3 Scoring (beide Modi)

Pro Spielblock (Spalte auf dem Zettel):

- Obere 6 Felder → Summe; ab 63 Punkten oben: Bonus +35 → **Ergebnis 1** (Backend: `ergebnisOben`)
- Untere 7 Felder → Summe → **Ergebnis 2** (`lowerSum`)
- **Ergebnis Spiel** = Ergebnis 1 + untere Summe + optional **Zusatz-Alle-Fünfe-Bonus** (`extraYatzyBonus`)

**Gesamtpunktzahl Run** = Summe aller `gameTotal` über alle Spiele (`run.totalScore`).

**Bonus-Delta-Anzeige (M30):** Der Bonus bei 63 entspricht „3 Würfeln je Augenzahl“ (`3 × 21 = 63`). Die Zeile „Ergebnis 1“ zeigt pro Block das laufende Delta `obere Summe − 3 × (Summe Augenzahlen der eingetragenen oberen Felder)` — `+N` grün (über Schnitt), `−N` rot (darunter), `±0` grau. Reine Frontend-Anzeige (`upperBonusDelta` in `frontend/lib/gameScoring.ts`), gilt für beide Modi.

**Bonus-Einblendung (M31):** Schließt eine obere Reihe vollständig (6/6) mit ≥63 ab, erscheint ein kurzes Glückwunsch-Overlay („Bonus erreicht! +35“) mit Animation, das nach 2,5 s automatisch schließt (oder per Tippen). Erkennung über `upperBonusAchieved` in `gameScoring.ts`, Anzeige via `BonusOverlay`. Pro Gerät abschaltbar (`lib/uiPrefs.ts`, Toggle auf `/solo` + `/multi`; kein Backend). Respektiert `prefers-reduced-motion`.

### 2.4 Zusatz-Alle-Fünfe

Ab dem 7. Alle-Fünfe-Eintrag (über alle Spielblöcke): per `POST /runs/:id/extra-yatzy` jeweils **+100** auf „Ergebnis Spiel“, rotierend Sp1 → Sp2 → …  
UI: `+`-Button an der Alle-Fünfe-Zeile, Anzeige `+N` Zusatz Alle Fünfe.

### 2.5 Letzten Eintrag löschen

Nur das **zuletzt eingetragene** Feld darf zurückgesetzt werden (`scoredSequence` auf `Field`, `nextScoredSequence` auf `Run`).  
API: `POST /runs/:runId/fields/:fieldId/clear` — danach kann ein anderes Feld gewählt werden. Gilt für Solo und Multiplayer.

### 2.6 Abschluss eines Laufs

1. Letztes Feld eintragen → Server aktualisiert `totalScore`
2. UI: Overlay „Du hast **X** Punkte erzielt“
3. Nutzer: „Ergebnis ansehen“ → `POST /runs/:id/finish` → `RunFinishScreen`
4. Vorzeitig: `POST /runs/:id/abandon` (offene Felder bleiben leer)

---

## 3. Multiplayer-Mechanik

### 3.1 Sessions

- Host: `POST /sessions` mit `gameCount`, `maxPlayers`, `useStrategyRules`, optional `leagueCode`, optional `showOpponentPool`
- Einladung per QR / Join-URL; Gäste: Startseite „QR-Code scannen“ oder `/multi/join?code=…` (Universal Link)
- Join erzeugt `Player` + `Run` (Kopie der Session-Regeln)
- Auth: Header **`X-Player-Secret`** auf Run-Endpunkten

**Gegner-Pool (M32):** Aktiviert der Host beim Erstellen `showOpponentPool`, liefert das Lobby-DTO je Spieler den Wert `rollsInPool`. Die Spiel-Topbar zeigt den Gegner-Pool **nur bei genau 2 Spielern** (Strategy-Modus). Das Frontend lädt den Wert ohne Polling — nur bei Spielstart und nach jeder eigenen Eintragung. Persistiert als Session-Flag `show_opponent_pool` (Default `false`).

**Pool-Endspiel (M33, nur Multiplayer/Strategy):** Aktiviert der Host beim Erstellen `poolEndgameEnabled`, darf nach Abschluss **aller** Runs der Spieler mit dem **eindeutig größten** Wurf-Pool **ein** bereits eingetragenes Feld verbessern: neuen (für den Feldtyp gültigen) Wert eintragen oder den alten Wert behalten. Erst danach werden Liga-Punkte vergeben und die Session auf `FINISHED` gesetzt; bei Gleichstand an der Spitze verbessert niemand. Sieger-Bestimmung: `determinePoolEndgameImprover`. Auflösung über `POST /sessions/invite/:code/pool-endgame` (`X-Player-Secret` des Siegers), **kein Polling** (Auflösung beim Öffnen des Abschluss-Screens). Session-Felder `pool_endgame_enabled` / `pool_endgame_improver_id` / `pool_endgame_resolved`. Die Eintrag-Voreinstellung im Strategy-Modus ist seitdem **3 Würfe** (vorher 2).

### 3.2 Serien (Liga)

Jede Session gehört zu einer **Serie** (`League` mit `leagueCode`):

- Neue Serie: Host erstellt Raum ohne `leagueCode` → neuer 6-stelliger Seriencode
- **Weitere Runde:** Host in abgeschlossener Lobby → „Neue Runde in derselben Serie“ → `POST /sessions` mit gleichem `leagueCode` → neuer Einladungscode, `roundNumber` erhöht sich

### 3.3 Ligapunkte (nach Rundenende)

Wenn alle Spieler-Runs einer Session `FINISHED` sind und Punkte noch nicht vergeben wurden (`pointsAwarded`):

- **Sieger:** +1 Siegpunkt + **Bonus** = Punktedifferenz zum Letztplatzierten
- **Alle anderen:** 0 Siegpunkte, 0 Bonus
- Punkte werden in `LeagueStanding` **fortgeschrieben** (über alle Runden derselben Serie)
- Rangliste in Lobby: `GET /sessions/invite/:code/ranking` → `leagueStandings` + Runden-Gewinner

### 3.4 Spielende Session

- Session `FINISHED`, wenn alle Player-Runs `FINISHED`
- Ligapunkte werden einmalig vergeben (`awardSessionLeaguePoints`)

---

## 4. Statistik

### 4.1 Persönliche Rekorde (`GET /stats`)

API liefert Rekorde über abgeschlossene Runs (bestes Gesamtergebnis, bestes Einzelspiel, Durchschnitt, Bestwerte pro Spielanzahl).  
Auf der **Bento-Startseite** wird nur der beste Gesamtscore in der Statistik-Kachel angezeigt; die vollständige Auswertung liegt auf `/stats` (Paarungen) bzw. persönlich im API-DTO (Komponente `StatsPanel` optional, derzeit nicht eingebunden).

### 4.2 Paarungen (`/stats`)

Aus **abgeschlossenen Multiplayer-Sessions** (`pointsAwarded: true`):

- Alle **Zweier-Kombinationen** pro Runde (auch bei 3+ Spielern)
- Direktdurchgang: höhere `totalScore` gewinnt; bei Gleichstand entscheidet `orderIndex`
- Anzeige: Siege, Differenzpunkte (+), App-Runden, optional manuelle Historie

**Detailseite** `/stats/pairing?key=Marc::Nicole%20Langebeck`:

- Schlüssel: alphabetisch sortierte Namen, getrennt durch `::`
- Liste der App-Runden mit Serie, Rundennummer, Datum, Scores

### 4.3 Manuelle Baselines

Tabelle `pairing_manual_baselines` für Spiele **vor** der App-Statistik:

- `extraWinsA/B`, `extraBonusA/B`, optional `note`
- Beispiel: Marc vs. Nicole Langebeck — historische Siege und Differenz werden zu App-Werten addiert

### 4.4 Namen zusammenführen

Tabelle `player_name_aliases` (`aliasName` → `canonicalName`):

- UI auf `/stats`: Dropdowns + Zusammenführen / Aufheben
- Wirkt auf Paarungsstatistik, Ligapunkte (Aggregation nach Hauptnamen)

---

## 5. Technische Architektur

### 5.1 Frontend

- Next.js 15, **`output: "export"`** (statischer Export nach `frontend/out/`)
- Env: `frontend/.env.production` → `NEXT_PUBLIC_API_URL`
- Pfade: `/`, `/solo`, `/play`, `/multi`, `/multi/join?code=…`, `/stats`, `/stats/pairing?key=…`
- `sessionStorage`: aktives Spiel (`lib/activeGame.ts`)
- UI: helles Glass-Design (`app/globals.css` mit `.home-bento-*`, `.stats-*`, `.setup-host-*`, `.play-*`)
- Vollbild-Routen ohne Dokument-Scroll: `FixedScreenShell` / `PlayScreenShell` (`play-route` auf `html`)

### 5.1.1 Bildschirm-Layouts

| Route | Shell / Layout | Besonderheiten |
|-------|----------------|----------------|
| `/` | `HomeScreenShell` | Bento-Grid `HomeBentoGrid`: groß „Raum erstellen“, Einzelspiel, Statistik, Code volle Breite; `ResumeActiveGame` |
| `/solo`, `/multi` | `SetupScreenLayout` | `AppScreenHeader`, `GameSetup` bzw. Host-Formular |
| `/stats`, `/stats/pairing` | scrollbare Inhaltsseite | `AppScreenHeader`, `PairingSummaryCard`, `NameMergePanel` |
| `/play` | `PlayScreenShell` | Kein Seiten-Scroll während aktives Spiel; `FitScoreSheet` skaliert Zettel; Eintrag fix unten |

### 5.1.2 Komponenten (Auszug)

| Komponente | Rolle |
|----------|--------|
| `HomeBentoGrid` | Start: Bento-Kacheln + Code-Eingabe |
| `AppScreenHeader` | Einheitlicher Kopf (Setup, Statistik) |
| `GameSetup` | Solo-Start mit `StrategyModeToggle` |
| `JoinByQrScan` | QR scannen auf Startseite / Join ohne Code |
| `PlayBoard` | Spiel, Overlay, Abandon, Feld löschen |
| `PlayTopBar` | Zurück (Start/Lobby), eigener Pool + optionaler Gegner-Pool (M32) |
| `BonusOverlay` | Bonus-Einblendung bei erreichtem Oberbonus (M31) |
| `FitScoreSheet` | Skaliert Zettel auf verfügbare Höhe |
| `ScoreSheetTable` | Zettel inkl. Zusatz Alle Fünfe und Bonus-Delta („Ergebnis 1“) |
| `ScoreEntryPanel` | Fixiertes Panel unten; Würfe nur bei Strategy |
| `RunCompleteOverlay` | Nach letztem Feld |
| `RunFinishScreen` | Nach `finish` (darf scrollen) |
| `NameMergePanel` | Namens-Aliase auf `/stats` |
| `PairingSummaryCard` | Paarungskarte auf `/stats` |

### 5.2 Backend

- Express + TypeScript, Port 3020
- SQLite + Prisma (`backend/prisma/dev.db`)
- Kernlogik: `playField.ts`, Scoring: `gameScoring.ts`, Validierung: `fieldScores.ts`
- Multiplayer: `sessionService.ts`, Liga: `leaguePoints.ts`, Statistik: `pairingStats.ts`, Namen: `playerNames.ts`

### 5.3 API-Basis

| Umgebung | API-Basis |
|----------|-----------|
| Lokal | `http://127.0.0.1:3020` |
| Produktion | `https://dicebudget.bottle-trade.de/api` (Nginx strippt `/api/`) |

### 5.4 API (Runs)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/health` | Status |
| `POST` | `/runs` | `{ "gameCount", "useStrategyRules" }` |
| `GET` | `/runs/:id` | Run-DTO inkl. `lastScoredFieldId`, `extraYatzyCount` |
| `POST` | `/runs/:runId/fields/:fieldId/rolls` | Optional; Strategy: Pool ab 4. Wurf |
| `POST` | `/runs/:runId/fields/:fieldId/complete` | `{ "score", "rollsUsed" }` — validiert Feldtyp |
| `POST` | `/runs/:runId/fields/:fieldId/clear` | Letztes Feld zurücksetzen |
| `POST` | `/runs/:runId/extra-yatzy` | Zusatz Alle Fünfe +100 |
| `POST` | `/runs/:runId/finish` | Alle Felder bewertet |
| `POST` | `/runs/:runId/abandon` | Vorzeitig beenden |

### 5.5 API (Sessions & Statistik)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `POST` | `/sessions` | `{ "gameCount", "maxPlayers", "useStrategyRules", "leagueCode"?, "showOpponentPool"? }` |
| `GET` | `/sessions/invite/:inviteCode` | Lobby |
| `POST` | `/sessions/invite/:inviteCode/join` | `{ "name" }` |
| `GET` | `/sessions/invite/:inviteCode/ranking` | Rangliste + Serienpunkte |
| `GET` | `/stats` | Persönliche Rekorde |
| `GET` | `/stats/pairings` | Paarungsliste |
| `GET` | `/stats/pairing?key=…` | Paarungsdetail |
| `GET` | `/stats/names` | Namen + Aliase |
| `POST` / `DELETE` | `/stats/names/merge` | Alias anlegen / entfernen |

Multiplayer-Runs: Header **`X-Player-Secret`**.

---

## 6. Datenmodell (Prisma)

### League / LeagueStanding

- `league_code` (Serie), `win_points`, `bonus_points` pro Spielername

### GameSession

- `invite_code`, `game_count`, `max_players`, `use_strategy_rules`, `status`
- `league_id`, `round_number`, `points_awarded`
- `show_opponent_pool` (Default `false`, M32)
- `pool_endgame_enabled` / `pool_endgame_improver_id` / `pool_endgame_resolved` (Default `false`/`null`/`false`, M33)

### Player

- `session_id`, `name`, `order_index`, `secret_token`, `run_id`

### Run

- `game_count`, `use_strategy_rules`, `total_score`, `total_rolls_used`, `rolls_in_pool`
- `extra_yatzy_count`, `next_scored_sequence`, `status`, `finished_at`

### Game / Field / Roll

- 13 Feldtypen pro Spiel; `Field.scored_sequence` für Reihenfolge der Einträge

### PairingManualBaseline / PlayerNameAlias

- Siehe § 4.3 und § 4.4

---

## 7. Features – Status

### Umgesetzt

- Singleplayer + Multiplayer, Strategy + Klassisch
- Wurf-Pool (Strategy), Zusatz Alle Fünfe, letzten Eintrag löschen
- Serien/Ligapunkte, neue Runde in derselben Serie
- Statistik: Rekorde, Paarungen, Namen zusammenführen, manuelle Baselines
- Server-Validierung Scores, Backend-Tests (`npm test`)
- PWA, Resume, Abandon, Abschluss-Overlay
- UI: Bento-Start, modernisierte Statistik/Setup/Spielzettel (ein Screen, kein Scroll im aktiven Spiel)

### Offen / Ideen

- Echte Würfel-UI (optional statt nur manueller Punkte)
- Frontend-Tests
- Admin-UI für manuelle Paarungs-Baselines (aktuell Migration/DB)

---

## 8. Risiken

- Client kann weiterhin nur über erlaubte Score-Mengen manipulieren (Server prüft Feldtyp, nicht physische Würfel)
- `playerSecret` in `sessionStorage` — Gerätewechsel erfordert erneutes Join
- Abuse auf Server: siehe `AGENT_RULES.md` (kein Polling, keine Dauerprozesse)
- Statischer Export: nach Deploy ggf. Browser-Cache leeren

---

## 9. Glossar

- **Spielanzahl (`game_count`):** Anzahl Spielblöcke (Spalten) pro Run (1–6)
- **Run:** ein Spieler-Durchlauf über alle Spalten
- **Serie / Liga:** `leagueCode` — mehrere Multiplayer-Runden mit fortlaufenden Serienpunkten
- **Siegpunkt / Bonus:** Ligapunkte (nicht Kniffel-Punkte auf dem Zettel)
- **Paarung:** Head-to-Head zweier Spieler über gemeinsame abgeschlossene Runden
- **Ergebnis Spiel:** Punkte eines Blocks (Spalte) inkl. Zusatz Alle Fünfe
- **Gesamtergebnis:** `total_score` = Summe aller Ergebnis-Spiel-Werte
