# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Aktueller Git-HEAD:** `549e8a7`  
**Sprache:** Deutsch  

Diese Datei ist absichtlich kurz. Aktiver Arbeitsstand: `docs/milestones_active.md`. iOS/App Store: `docs/ios_current.md`. Dauerhafte Projektentscheidungen: `docs/decisions.md`.

## Deployment-Status

| Bereich | Status |
|---------|--------|
| Web | Live: https://dicebudget.bottle-trade.de |
| Backend/API | Live ueber https://dicebudget.bottle-trade.de/api |
| Legal dice.budget | Impressum + Datenschutz live |
| Git/Server | Branch `milestone-22-prep`, HEAD `549e8a7` |
| Produktivcode | M34 + M35 + UI-Politur sind Web/Backend-seitig deployed |
| iOS/TestFlight | Aktuell `2.0 (6)`; M34 + M35 + UI-Politur noch nicht im Build |

## Offene Aufgaben

1. iOS-Build `2.0 (7)` mit M34 + M35 + UI-Politur auf dem Mac bauen und hochladen.
2. App Store Connect: Paid Applications Agreement, Bank/Steuer, Preis `1,19 EUR`.
3. Store-Metadaten: Screenshots, Beschreibung DE, Datenschutzfragebogen.
4. Optional: Stats-Reset-/Baseline-Endpunkte auf eigene Paarungen einschraenken (aktuell ohne Auth).
5. Optional: `milestone-22-prep` nach Nutzer-Freigabe auf `main` bringen.

## Pflicht-Workflow

- Keine Commits ohne ausdrueckliche Nutzer-Anweisung.
- Nach jeder Code-Aenderung muessen GitHub, Server und Mac synchronisiert werden.
- Der verbindliche Ablauf steht in `AGENT_RULES.md` Sektion 9 und darf nicht abgekuerzt werden.
- Der Agent arbeitet nur auf dem Server und hat keinen Mac- oder sudo-Zugriff.
- Reine Frontend-Aenderungen: auf dem Server genuegt `cd frontend && npm run build`; Nginx liefert `frontend/out/` direkt aus.
- Backend- oder Nginx-Neustarts mit `sudo` sind immer Nutzer-Aufgabe.

## Standard-Lesereihenfolge

Bei jeder Uebergabe lesen:

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md`

Nur bei Bedarf:

4. `docs/ios_current.md`
5. `docs/decisions.md`
6. `docs/milestones_archive.md`
7. `docs/ios_archive.md`

## Uebergabeprompt Fuer Neuen Agent

Kopiere diesen Block in einen neuen Chat und ergaenze unter "Auftrag" die konkrete Aufgabe.

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

Wichtig:
- AGENT_RULES.md hat Vorrang vor allen anderen Dokumenten.
- Sektion 9 in AGENT_RULES.md ist Pflicht: Nach jeder Code-Aenderung GitHub + Server + Mac synchronisieren und dem Nutzer immer nummerierte [Server]/[Mac]-Befehle geben.
- Keine sudo-Befehle ausfuehren; sudo-Schritte sind Nutzer-Aufgabe.
- Keine Watcher, kein Polling, keine Dauerprozesse, kein Auto-Deploy.
- Der Agent arbeitet direkt auf dem Server unter /home/bottleadmin/projects/kniffel.
- Der Mac-Pfad des Nutzers ist /Users/marclangebeck/projects/kniffel.

Aktueller Stand:
- Branch: milestone-22-prep
- Git-HEAD: 549e8a7
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), naechster Upload 2.0 (7)
- M34 + M35 + UI-Politur sind Web/Backend-seitig erledigt und deployed, aber noch nicht im iOS-Build.

Auftrag:
<hier konkrete Aufgabe einfuegen>
```
# Übergabe – dice.budget (Kniffel Strategy Edition)

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**GitHub:** `marclangebeck/dicebudget` · Branch **`milestone-22-prep`**  
**Sprache:** Deutsch  
**Stand:** 2026-06-01 · Commit `a18f919`

> **Sync-Pflicht:** Nach jeder Code-Änderung müssen **GitHub, Server und Mac** auf demselben Stand sein. Der genaue Ablauf (nummerierte `[Server]`/`[Mac]`-Befehle, sudo nur durch Nutzer) steht in **`AGENT_RULES.md` Sektion 9**. Immer so kommunizieren.
>
> **iOS-Versionierung:** App Store Connect ist bei **Version 2.0**, aktueller Build **2.0 (6)**. Build-Nummern zählen **pro Versionsstring**; nächster Upload = **2.0 (7)**. Frühere „1.0 / Build 18/19" sind überholt.

---

## Ist-Stand (kurz)

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Legal (dice.budget) | Impressum + Datenschutz — **live** |
| Legal (Plattform) | bottle-trade.de — **live** (separates Projekt) |
| **M29 Punktwahl-Eintrag** | **Erledigt** — Feld antippen → Overlay (Punkte + Würfe) → Eintragen |
| **M30 Bonus-Delta-Anzeige** | **Erledigt** — „Ergebnis 1“ zeigt Delta zur Soll-Marke „3 je Augenzahl“ (+ grün / − rot / ±0 grau) |
| **M31 Bonus-Einblendung** | **Erledigt** — Overlay bei 6/6 & ≥63, Auto-Close 2,5 s, Geräte-Toggle |
| **M32 Topbar & Gegner-Pool** | **Erledigt** — „Rest" entfernt; Multiplayer-Host-Toggle „Gegner-Pool sichtbar" (2 Spieler) |
| **M33 Pool-Endspiel** | **Erledigt + deployed** — Multiplayer-Host-Toggle „Pool-Endspiel": Sieger mit eindeutig größtem Pool verbessert am Ende 1 Feld (neuer Wert oder behalten). Würfe-Standard 2→3 |
| **M34 Bugfixes + Stats-Reset** | **Erledigt + deployed (Web/Backend)** — Bonus-Konfetti, Support-Link, M32-Fix (Gegner-Pool-Refresh), M33-Fix (Pool-Endspiel ausführbar), Prob 2 (Stats-Alias-Merge), Prob 3 (Stats serverseitig zurücksetzen), Capacitor-Fix (Paarungs-Detail via `next/link`). **Noch nicht in iOS-Build** |
| **M35 Paarungen bearbeiten** | **Erledigt + deployed (Web/Backend)** — „✏️ Paarung bearbeiten" auf `/stats/pairing`: Siege je Spieler + Netto-Punktedifferenz editierbar (außerhalb der App gespielte Partien nachtragen). Kombinierte Gesamtübersicht, Differenz netto. Tabelle `pairing_manual_baselines` reaktiviert (**keine neue Migration**), `POST /stats/pairings/baseline`. **Noch nicht in iOS-Build** |
| **UI-Politur (2026-06-01)** | **Erledigt + deployed (Web)** — gewählter Punktwert im Eintrags-Overlay **gelb ausgefüllt** (statt schwacher Rahmen); Spielzettel **füllt die volle Bildschirmhöhe** (Zeilen wachsen, Ergebnis-Zeilen größer, adaptiv zum iPhone-Format). **Noch nicht in iOS-Build** |
| Frontend Deploy (Server) | Nach Pull: `cd frontend && npm run build` (Nginx aus `out/`, **kein sudo**, sofort live) — **deployed** (Stand `a18f919`) |
| Backend Deploy (Server) | `sudo bash infra/scripts/deploy-backend-prod.sh` (Migration + Restart) — **deployed** (Reset- + Baseline-Endpunkt aktiv, kein neues Schema) |
| iOS im Repo | Version **2.0** (Build-Nr. in Xcode setzen) |
| TestFlight | **2.0 (6)** (Upload durch Nutzer). **M34 + M35 + UI-Politur** erfordern neuen Upload **2.0 (7)** |
| Sync Mac/Server/GitHub | Commit **`a18f919`** auf `origin/milestone-22-prep` (alle gleichauf) |

**Nächste Priorität (typisch):** neuen iOS-Build **2.0 (7)** mit **M34 + M35 + UI-Politur** hochladen → App Store Connect (Paid Agreement, Bank/Steuer, 1,19 €, Screenshots, Datenschutzfragebogen, Review).

---

## Übergabe-Prompt (Copy & Paste)

Kopiere den gesamten Block in einen **neuen Chat**. Ergänze unten unter **„DEINE AUFTRÄGE“** die konkrete Aufgabe.

```
Du arbeitest am Projekt dice.budget weiter (Repo: kniffel).

LIES ZUERST (Reihenfolge):
1. AGENT_RULES.md
2. HANDOVER.md
3. GOiOS.md
4. milestones.md → Abschnitt „Aktueller Arbeitsstand“

Antworten auf Deutsch. Keine Commits ohne explizite Nutzer-Anweisung.

─── PROJEKT ───
Yatzy/Kniffel, 1–6 Spiele pro Partie, Strategy (Pool) vs. Klassisch.
Solo: lokal (frontend/lib/localSoloRun.ts). Multi: pseudonym playerId (UUID).
Web + iOS: Next.js static export + Capacitor 7.

─── PFADE ───
Prod:     https://dicebudget.bottle-trade.de
App:      /app (iOS-Start) · Legal: /datenschutz, /impressum
Branch:   milestone-22-prep · Commit: a18f919
iOS:      Version 2.0 · aktueller TestFlight-Build 2.0 (6) · nächster Upload 2.0 (7) (M34 + M35 + UI-Politur)
Server:   /home/bottleadmin/projects/kniffel
Mac:      /Users/marclangebeck/projects/kniffel
Xcode:    /Users/marclangebeck/projects/kniffel/frontend/ios/App/App.xcworkspace
Bundle:   de.bottletrade.dicebudget
Kontakt:  info@bottle-trade.de (Marc Langebeck, Kiel — frontend/lib/legal.ts)

─── M29 EINTRAG (aktueller Stand) ───
• Feld auf Zettel antippen → Overlay (ScoreEntryPanel) von OBEN am Bildschirm
• Obere Sektion (Einser–Sechser): Zahlen-Buttons 0, 2, 4, … (keine Würfel-Icons)
• Unten: Dreier/Vierer Pasch + Chance 0–30 · Full House/Straßen/Yatzy 0 oder Festwert
• Gewählte Punkte + Würfe: hellgelbe Markierung (#fef3c7)
• Strategy: Würfe wählen (Default 2) · Klassisch: rollsUsed=1 intern
• Korrektur: befülltes Feld antippen → gleiches Overlay + „Eintrag löschen“
• ENTFERNT: Würfel-Zähler, Wurf vergleichen, CommittedThrowBanner, DiceThrowOverlay
• Kern-Dateien: PlayBoard.tsx, ScoreEntryPanel.tsx, FieldScoreChoiceGrid.tsx, lib/labels.ts (fieldScoreChoices)

─── M30 BONUS-DELTA (aktueller Stand) ───
• Zeile „Ergebnis 1“ zeigt pro Block Delta zur Soll-Marke „3 je Augenzahl“ (Bonus 63)
• delta = obere Summe − 3 × (Summe Augenzahlen der eingetragenen oberen Felder)
• Anzeige nur das Delta: +N grün · −N rot · ±0 grau · Tooltip mit Klartext
• Erscheint erst ab erstem oberen Eintrag; gilt Solo + Multiplayer
• Kern-Dateien: lib/gameScoring.ts (upperBonusDelta), ScoreSheetTable.tsx (SummaryTile)

─── M31 BONUS-EINBLENDUNG (aktueller Stand) ───
• Overlay „Bonus erreicht! +35“ wenn obere Reihe 6/6 mit ≥63 abschließt
• Pop-/Spin-Animation, Auto-Close 2,5 s (oder Tippen); nennt Spielblock
• Bei komplettem Run nur Abschluss-Overlay (keine Stapelung)
• Geräte-Einstellung (kein Backend): Toggle auf /solo + /multi, Standard an
• Kern-Dateien: BonusOverlay.tsx, BonusCelebrationToggle.tsx, lib/uiPrefs.ts, gameScoring.upperBonusAchieved, PlayBoard.handleSubmit

─── M32 TOPBAR & GEGNER-POOL (aktueller Stand) ───
• „Rest“-Chip entfernt — Topbar zeigt nur eigenen Pool
• Multiplayer: Host-Toggle „Gegner-Pool sichtbar“ auf /multi
• Anzeige nur bei genau 2 Spielern + Strategy → Chip „Gegner“
• Kein Polling: Nachladen nur bei Start + nach eigener Eintragung
• Backend: Session-Flag show_opponent_pool (Migration), Lobby liefert rollsInPool je Spieler nur wenn Flag an
• Kern-Dateien: backend sessionService.ts/sessions.ts, app/multi/page.tsx, PlayBoard.tsx, PlayTopBar.tsx, lib/sessionTypes.ts

─── M33 POOL-ENDSPIEL (aktueller Stand) ───
• NUR Multiplayer (Strategy). Host-Toggle „Pool-Endspiel" auf /multi
• Nach Abschluss ALLER Runs: Spieler mit dem EINDEUTIG größten Wurf-Pool darf
  EIN Feld verbessern → neuen Wert eintragen ODER „Alten Wert behalten & beenden"
• Erst danach Liga-Punkte + Session FINISHED. Gleichstand an der Spitze → niemand
• Kein Polling: Auflösung beim Öffnen des Abschluss-Screens des Siegers
• Backend: GameSession pool_endgame_enabled/_improver_id/_resolved (Migration
  20260530120000_session_pool_endgame), determinePoolEndgameImprover(),
  resolvePoolEndgame(), Endpunkt POST /sessions/invite/:code/pool-endgame
• Kern-Dateien: backend sessionService.ts/sessions.ts/errorHandler.ts,
  PoolEndgamePanel.tsx, PlayBoard.tsx (Improver-Phase), app/multi/page.tsx,
  lib/api.ts, lib/sessionTypes.ts, app/globals.css (.play-endgame-*)
• ZUSATZ: Würfe-Voreinstellung Strategy 2 → 3 (PlayBoard.defaultRollsUsed)

─── M34 BUGFIXES + STATS-RESET (2026-05-31) ───
• Bonus-Konfetti: BonusOverlay.tsx + globals.css (.bonus-confetti*), prefers-reduced-motion
• Support-Link (mailto) im Start-Footer: HomeBentoGrid.tsx (HomeLegalFooter)
• M32-Fix Gegner-Pool: Refresh bei visibilitychange/focus + Aktualisieren-Tap
  (PlayBoard.tsx, PlayTopBar.tsx) — weiterhin KEIN Polling
• M33-Fix Pool-Endspiel ausführbar: Abschluss-Screen „Pool-Endspiel läuft" + Aktualisieren;
  ScoreSheetTable.allowSelectWhenFinished (PlayBoard.tsx, ScoreSheetTable.tsx)
• Prob 2 Stats-Alias-Merge: gleicher Alias = dieselbe Person, reihenfolge-unabhängig,
  Alias-Vorrang vor self, „Du"-Repräsentant — lib/pairingMerge.ts (NEU),
  app/stats/page.tsx, app/stats/pairing/page.tsx
• Prob 3 Stats serverseitig zurücksetzen (DESTRUKTIV, alle Geräte):
  Auswahl-Modus in /stats → ausgewählte Paarungen löschen.
  Backend resetPairings() + POST /stats/pairings/reset löscht abgeschlossene
  2-Spieler-Sessions inkl. Runs/Games/Fields/Rolls; Mehr-Spieler-Sessions geschützt
  (skippedMultiPlayer). KEIN neues Prisma-Schema. HINWEIS: LeagueStanding wird NICHT
  rückwirkend neu berechnet; Endpunkt OHNE Auth (ggf. auf eigene Paarungen einschränken).
  Dateien: backend pairingStats.ts + routes/stats.ts, frontend lib/api.ts,
  app/stats/page.tsx, components/PairingSummaryCard.tsx, globals.css, pairingStats.test.ts
• Capacitor-Fix Paarungs-Detail: Karte navigiert via next/link statt <a href>
  (voller Reload fiel in der App auf index.html → NativeAppEntry-Redirect zum Start).
  Datei: components/PairingSummaryCard.tsx

─── M35 PAARUNGEN BEARBEITEN (2026-05-31) ───
• „✏️ Paarung bearbeiten" auf /stats/pairing: Siege je Spieler + EINE Netto-
  Punktedifferenz (Betrag + bevorzugte Seite) editierbar → außerhalb der App
  gespielte Partien nachtragen
• Statistik = EINE kombinierte Gesamtübersicht (App-Runden + manuelle Werte);
  Differenz wird NETTO angezeigt (Plus nur auf der führenden Seite, andere leer)
• Reaktiviert Tabelle pairing_manual_baselines (KEINE neue Migration; Tabelle
  bestand seit 20260523, war seit M22 nur geleert). Backend rechnet sie in
  accumulatePairings() ein (nur Gesamt; App-Werte = Untergrenze). Neuer Endpunkt
  POST /stats/pairings/baseline (upsertPairingBaselines); „Statistik zurücksetzen"
  löscht zugehörige Baselines mit. OHNE Auth, wirkt auf allen Geräten
• buildBaselineWrites() in lib/pairingMerge.ts übersetzt Gesamtwerte → Baseline-
  Writes (richtige A/B-Orientierung bei Alias-Zusammenführung, ein Repräsentanten-
  Quell-Key, andere auf 0)
• Dateien: backend pairingStats.ts + routes/stats.ts (+ pairingStats.test.ts),
  frontend lib/{pairingTypes,normalizePairing,pairingMerge,api}.ts,
  components/PairingEditOverlay.tsx (NEU), app/stats/pairing/page.tsx,
  components/PairingSummaryCard.tsx

─── UI-POLITUR (2026-06-01) ───
• Punktwahl gelb gefüllt: Im Eintrags-Overlay war der gewählte Punktwert nur
  schwach umrandet (die weiße Grundfläche der .field-score-*-btn überschrieb bei
  gleicher CSS-Spezifität die gelbe Füllung von .play-score-btn--selected) →
  jetzt höher spezifische Regel, gelb ausgefüllt wie die Würfe-Auswahl. globals.css
• Spielzettel füllt die volle Höhe: FitScoreSheet kappte den Zettel auf seine
  kurze Inhaltshöhe (16 Zeilen sind KONSTANT, Spiele = Spalten). Jetzt füllt der
  Zettel die volle verfügbare Höhe (Zeilen wachsen), Ergebnis-Zeilen ~1,4× höher
  als Feld-Zeilen, adaptiv zum iPhone-Format; bei zu wenig Platz weiter Skalierung
  (kein Seiten-Scroll, M20). Dateien: FitScoreSheet.tsx, ScoreSheetTable.tsx,
  globals.css (.play-score-table Höhen 6% / 8.6%)

─── ERLEDIGT (nicht neu erfinden) ───
• M1–22, M23–27 (UI iOS abgenommen)
• M29 Punktwahl-Eintrag (Commits 087d5d9 … 2e68f53)
• M30 Bonus-Delta-Anzeige (Commit 1a03a32)
• M31 Bonus-Einblendung + M32 Topbar/Gegner-Pool (Commit 86637df)
• M33 Pool-Endspiel + Würfe-Standard 3 (Commit dade49d)
• M34 Bugfixes + Stats-Reset (Commits dec2bc0, 8bde575, ad64746)
• M35 Paarungen bearbeiten (Commit 68bd6eb)
• UI-Politur: Punktwahl gelb + Zettel füllt Höhe (Commit a18f919)
• Legal dice.budget + bottle-trade.de (live)
• Legal-Daten: frontend/lib/legal.ts + branding.ts
• rsync-Fix: brew unlink rsync vor Xcode-Upload
• Spiel beenden: ✕ in PlayTopBar (ABANDON_RUN_CONFIRM)
• Backend deployed (Migrationen show_opponent_pool + pool_endgame; Reset- + Baseline-Endpunkt, Service läuft)
• Web deployed (frontend/out/ nach M35 + UI-Politur neu gebaut, Stand a18f919)
• TestFlight 2.0 (6) (Upload durch Nutzer); M34 + M35 + UI-Politur NOCH NICHT im Build

─── OFFEN (typische nächste Themen) ───
1. iOS-Build 2.0 (7) mit M34 + M35 + UI-Politur hochladen (Capacitor-Fix nötig für Paarungs-Detail in App!)
2. App Store Connect: Paid Agreement, Bank/Steuer, Preis 1,19 €
3. Store: Screenshots 6.7", Beschreibung DE, Datenschutzfragebogen
4. Web auf Server deployen nach UI-Änderungen (npm run build; reines Frontend = kein sudo)
5. Bei Backend-Änderungen: sudo bash infra/scripts/deploy-backend-prod.sh (Migration + Restart)
6. Optional: Stats-Reset-/Baseline-Endpunkte auf eigene Paarungen einschränken (aktuell ohne Auth)
7. Optional: milestone-22-prep → main (nur nach Nutzer-Freigabe)

─── SYNC GITHUB + SERVER + MAC (PFLICHT) ───
Vollständiger Workflow + Regeln: AGENT_RULES.md Sektion 9.
Kurzfassung — nach jeder Code-Änderung immer nummeriert [Server]/[Mac] ausgeben:
[Server] (Agent):  git add -A && git commit -m "..." && git push origin milestone-22-prep
[Server] (Agent):  cd backend && npm run build ; cd ../frontend && npm run build
[Mac, sudo, Nutzer, NUR bei Backend-Code]:
                   sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
[Mac] (Nutzer):    cd /Users/marclangebeck/projects/kniffel && git pull origin milestone-22-prep
Hinweis: Agent hat KEIN sudo und KEINEN Mac-Zugriff → sudo/Mac-Schritte immer als Nutzer-Aufgabe.

─── iOS-BUILD / TESTFLIGHT (Mac) ───
cd /Users/marclangebeck/projects/kniffel
git pull origin milestone-22-prep
cd frontend && npm run build:ios
brew unlink rsync 2>/dev/null; true
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
Xcode: Signing-Team wählen (DEVELOPMENT_TEAM nicht im Git!) ·
       Version 2.0 · Build 7 (nächster Upload) → Clean → Archive → Upload

─── WEB-DEPLOY (Server) ───
cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build
# Nginx: frontend/out/ — sudo deploy-frontend-prod.sh nur bei Nginx-Config-Änderung

─── BACKEND-DEPLOY (Server, nur bei Backend-Änderung) ───
cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
sudo bash infra/scripts/deploy-backend-prod.sh   # npm install + prisma migrate deploy + Restart

─── WICHTIGE DATEIEN (Spiel/Eintrag) ───
frontend/components/PlayBoard.tsx
frontend/components/ScoreEntryPanel.tsx
frontend/components/FieldScoreChoiceGrid.tsx
frontend/components/ScoreSheetTable.tsx ← Zettel-Zellen/Höhe (UI-Politur 2026-06-01)
frontend/components/FitScoreSheet.tsx  ← Zettel füllt volle Höhe / skaliert (UI-Politur)
frontend/components/PlayTopBar.tsx     ← Pool/Gegner-Pool-Chips (M32)
frontend/components/BonusOverlay.tsx   ← Bonus-Einblendung (M31)
frontend/lib/labels.ts              ← fieldScoreChoices, upperFieldDieCount
frontend/lib/gameScoring.ts         ← upperBonusDelta (M30), upperBonusAchieved (M31)
frontend/lib/uiPrefs.ts             ← Bonus-Einblendung-Toggle (M31)
frontend/lib/legal.ts
frontend/app/globals.css              ← .field-entry-*, .play-score-table (UI-Politur), .bonus-overlay-* (M31)
backend/src/services/sessionService.ts ← show_opponent_pool/rollsInPool (M32), Pool-Endspiel (M33)
backend/src/services/pairingStats.ts ← Paarungsstatistik + manuelle Baselines (M34/M35)
frontend/components/PairingEditOverlay.tsx ← Paarung bearbeiten: Siege + Netto-Differenz (M35)
frontend/lib/pairingMerge.ts        ← Alias-Merge + buildBaselineWrites (M34/M35)
frontend/components/PoolEndgamePanel.tsx ← Pool-Endspiel: Feld verbessern (M33)

─── STOLPERSTEINE ───
• Web-Deploy ≠ iOS — UI in App erst nach npm run build:ios + Archive
• ios/App/App/public/ ist gitignored — build:ios auf Mac Pflicht
• git pull blockiert durch pbxproj → git restore …/project.pbxproj
• Signing-Fehler nach Pull → Xcode: Signing & Capabilities → Team wählen
• Copy failed → brew unlink rsync, Xcode mit System-PATH
• Capacitor scrollEnabled:false → Legal nur in LegalScrollShell
• com.mlangebeck.mobileapp in Connect IGNORIEREN

Nutzer: Marc Langebeck, Xcode-Einsteiger — kleine Schritte, kopierbare Befehle.

─── DEINE AUFTRÄGE (vom Nutzer — hier eintragen) ───

```

---

## M29 — Eintrag (Referenz)

| Feldtyp | Auswahl im Overlay |
|---------|-------------------|
| Einser … Sechser | 0, face×1 … face×5 (nur Zahlen) |
| Dreier/Vierer Pasch, Chance | 0–30 |
| Full House, Straßen, Yatzy | 0 oder Festwert |

Logik: `fieldScoreChoices()` in `frontend/lib/labels.ts` (parallel Backend `fieldScores.ts`).

---

## Prompt für neuen Agent (Referenz)

### Was das Projekt ist

- **Yatzy/Kniffel** mit wählbarer **Spielanzahl 1–6** (13 Felder pro Block).
- **Zwei Modi:** Strategy (`useStrategyRules: true`, Pool) vs. Klassisch.
- **Singleplayer:** lokal (`frontend/lib/localSoloRun.ts`).
- **Multiplayer:** pseudonym via `playerId` (UUID lokal).
- **Serien / Statistik:** wie in milestones.md.

### Tech-Stack

| Teil | Stack |
|------|--------|
| Backend | Express, TypeScript, Prisma, SQLite, Port **3020** |
| Frontend | Next.js 15, Tailwind v4, static export (`out/`), Dev **3021** |
| iOS | Capacitor 7, Bundle `de.bottletrade.dicebudget` |
| Prod Web | https://dicebudget.bottle-trade.de |

### Wichtige Dateien

```
frontend/components/PlayBoard.tsx
frontend/components/ScoreEntryPanel.tsx
frontend/components/FieldScoreChoiceGrid.tsx
frontend/components/ScoreSheetTable.tsx
frontend/components/PlayTopBar.tsx
frontend/components/BonusOverlay.tsx
frontend/lib/labels.ts
frontend/lib/gameScoring.ts
frontend/lib/uiPrefs.ts
frontend/lib/localSoloRun.ts
frontend/lib/legal.ts
frontend/app/globals.css
frontend/app/multi/page.tsx
backend/src/services/sessionService.ts
frontend/ios/App/App.xcworkspace
```

### Bereits erledigt

- Milestones **1–22**, **23–27**, **M29** (Punktwahl-Eintrag), **M30** (Bonus-Delta), **M31** (Bonus-Einblendung), **M32** (Topbar/Gegner-Pool), **M33** (Pool-Endspiel), **M34** (Bugfixes + Stats-Reset), **M35** (Paarungen bearbeiten), **UI-Politur** (Punktwahl gelb + Zettel füllt Höhe)
- TestFlight **2.0 (6)** (Upload durch Nutzer); **M34 + M35 + UI-Politur** erfordern neuen Upload **2.0 (7)**
- Backend deployed: Migrationen `show_opponent_pool` + `pool_endgame`, Reset- + Baseline-Endpunkt, Service läuft
- Legal-Seiten live
- Backend-Tests: `cd backend && npm test`

### Deploy

```bash
# Web (Server):
cd /home/bottleadmin/projects/kniffel/frontend && npm run build

# iOS (Mac):
cd /Users/marclangebeck/projects/kniffel/frontend && npm run build:ios
```

**Keine Commits**, es sei denn, der Nutzer verlangt es explizit.

### Gesprächskontext

- Nutzer batcht **iOS-Releases**, testet Simulator + TestFlight.
- Antworten auf **Deutsch**, präzise, kopierbare Befehle.
- Nutzer: Marc Langebeck, Xcode-Einsteiger.

---

## Schnellcheck

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm test
cd /home/bottleadmin/projects/kniffel/frontend && npm run build
curl -s https://dicebudget.bottle-trade.de/api/health
git log -1 --oneline   # erwartet: a18f919 (oder neuer)
grep CURRENT_PROJECT_VERSION frontend/ios/App/App.xcodeproj/project.pbxproj | head -1   # Build-Nr. wird in Xcode gesetzt (Version 2.0)
```

---

*Doku-Index: GOiOS.md · milestones.md · CHANGELOG.md · docs/testflight-app-store.md*
