# Changelog

Alle relevanten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

### Changed
- **Menü-Version (iOS):** zeigt die echte Xcode-/Bundle-Build-Nummer zur Laufzeit (`@capacitor/app` `App.getInfo`); Web bleibt bei `NEXT_PUBLIC_APP_*` (Fallback typisch `web`)

### Added
- **Zettel-Lauffeuer:** Kurzes umlaufendes Highlight (~1,2 s) wenn eine Feld-Zeile (über alle Spiele) oder eine Spiel-Spalte (13 Felder) voll wird — rein visuell, blockiert nicht; an Erfolgsanimationen-Toggle gekoppelt
- **Visuelle Einblendungen:** Info-„i“ und Settings-Text um Zeilen-/Spalten-Lauffeuer ergänzt
- **Einswurf-Sound:** Kurzer Ping bei Strategy-Eintrag mit genau 1 Wurf und Score &gt; 0 (kein Overlay; nicht bei Achievement/Korrektur/Verkauf)
- **Spalten-Pool-Boni (M40):** Erster Spieler: Spalte oben mit Bonus / unten voll / gleiche Spalte komplett — je +2 Pool (max. 6); Labs + Session-Flag
- **Menü-Version (M39):** Hamburger zeigt `Version 2.0 (…)`; iOS native Bundle-Build, Web aus `NEXT_PUBLIC_APP_*`
- **Fortschritt 25/50/75 %:** Punktdifferenz zum Gegner im Overlay („X Punkte voraus/zurück“)
- **Hausregel auto (2 Spieler, Strategy):** 2× Alle Fünfe ≤3 Würfe → Gegner-Pool **halbiert** + Overlay
- **Hausregel auto (2 Spieler, Strategy):** 3× Alle Fünfe ≤3 Würfe → Gegner-Pool **0** + Overlay (Vorrang vor 2×)
- **Hausregel auto (2 Spieler, Strategy):** Wer zuerst den gesamten oberen Bereich (Spiele × 6) voll hat, erhält die offenen oberen Felder des Rivalen als Pool + Overlay
- **Hausregeln-Toggles / Info-„i“:** Labs-Toggles inkl. Oberer-Bereich und 3×; Info-Overlay pro Regel und unter Visuelle Einblendungen
- **Session-Flags:** Host-Toggles (`ruleYatzyStreak2`, `ruleYatzyTriple`, `ruleUpperRace`) beim Raum-Erstellen
- **Statistik:** Paarungen lokal ausblenden (`hiddenPairings`); Wiederherstellen; Startscreen-Bilanz berücksichtigt Hide-Liste

### Fixed
- **Achievement-/Einswurf-Sounds intermittierend:** Ursache war `AudioContext` oft noch `suspended` nach async Feldeintrag (iOS/WebView) plus unnötige Mute über `prefers-reduced-motion`. Fix: Unlock/Resume synchron im Tap-Handler, `await resume()` vor dem Abspielen, Sounds nur noch am Sounds-Toggle
- **Strategy-Würfe nur Pool:** Eintrag-Chips und Backend prüfen nicht mehr das globale Restbudget (`×39`) — bei Pool 0 immer 1–3 Würfe; mit Pool entsprechend mehr. Behebt blockierte Endfelder (nur Chip „1“ / Fehler trotz erwarteter Feldwürfe).
- **Web ohne Admin-Key im Bundle:** Öffentlicher Prod-Build bettet `NEXT_PUBLIC_ADMIN_API_KEY` nicht mehr ein; Admin-UI nur in bewussten Admin-iOS-Builds (Mac-`.env.production`)
- **finalizeSessionStats Race:** Erste Entscheidung (Werten / Nicht werten) gewinnt atomar; kein Überschreiben von Liga-Punkten / `includeInPairingStats`
- **Absolute Baseline Fortschreiben:** Nach Admin-Zielstand fließen neue App-Partien wieder in Siege und Diff (App-Snapshot); kein Zurück zum Alias-Additiv-Drift
- **Neue Runde Flags:** Lobby übergibt `showOpponentPool` / Pool-Endspiel / House-Rules an `createGameSession`
- **Pairing-Cache:** Nach Session-Finalize invalidiert (nicht erst nach 60 s / nur bei Baseline-Reset)
- **Auth-Fehlermeldung:** Baseline/Reset brauchen Admin-Key (Text an Backend-Ist angepasst)

### Changed
- **Strategy-Wurfregel:** Limit pro Feld = 3 + aktueller Pool (kein hartes Gesamtbudget mehr als Eintragssperre); `totalRollsUsed`/`rollsRemaining` bleiben Statistik
- **Absolute Baseline:** Speichert zusätzlich App-Snapshot (`app_*_snap`); Semantik = Ziel zum Korrekturzeitpunkt, danach Fortschreiben
- **Root-Viewport:** `maximumScale: 1` analog Stats/Settings (weniger iOS-Fokus-Zoom)
- **Doku:** Web öffentlich ohne Key; Admin nur Mac-Env vor `build:ios`

### Changed
- **Doku 2026-08-07:** HANDOVER / ios_current / milestones_active / GOiOS / milestones auf HEAD `f5c9ae7`, TestFlight 2.0 (~45+), M30, absolute Stats, Verwalten-Menü
- **Statistik Verwalten-Menü:** Aktualisieren, Auswählen/Löschen und „ausgeblendete wieder anzeigen“ hinter „Verwalten“; Admin-Löschen als „Löschen · Server, alle Geräte“
- **Stats Admin Stufe 0:** Workflow-Banner; Auswahl „Korrigieren / bereinigen“; Server bereinigen primär; lokales Ausblenden nur mit Extra-Admin-Warnung; Baseline-Text ohne Klarname-Anspruch — Stufe A (playerId-Links) bewusst später
- **Statistik Sync-Klarheit:** „Hier ausblenden · nur Gerät“ vs. „Server bereinigen · alle Geräte“; Baseline-Hinweis wenn App-Siege die Untergrenze sind; Stats/Home laden bei App-Fokus neu + Button „Aktualisieren“
- **InApp-Käufe (Features):** Wording „Hausregeln“ in Spielregeln/Tour/Overlays durch „InApp-Käufe (Features)“ ersetzt (Vorbereitung Monetarisierung)
- **Brennt:** Zwei Optionen — Neu würfeln (−1 Pool, nur brennender Würfel; Rest liegen lassen) oder Augenzahl selbst (−2 Pool, daneben legen)
- **Paarung bearbeiten (M38):** Siege/Diff nur noch mit Admin-Key (widerruft die temporäre Öffnung für iOS ohne Key)
- **Feldeintrag-Performance:** weniger Queries, Complete ohne Roll-Historie, Lobby mid-game `?lite=1`, Overlay vor Lobby-Wait
- **Hausregel Brennt:** Pool-Kosten 1 (siehe auch unten); Auto-Regeln nur bei Session-Flag + Strategy-Duell

### Fixed
- **Footer aktiver Tab:** aktueller Screen (Home/Statistik/Spielregeln) mit Pill, Gold-Akzent und stärkerem Icon — nicht mehr immer nur Home hervorgehoben
- **Stats/Settings Zoom:** Pinch-Zoom aus; Viewport `maximumScale: 1`; `glass-input` mind. 16px — verhindert iOS-Fokus-Zoom, der nur per Menüwechsel zurücksetzte
- **Paarungs-Baseline absolut:** Admin-Siege und Punktedifferenz speichern Zielstand (`isAbsolute`), nicht Additiv zu geräteabhängigem Alias-Merge — verhindert „dazuaddiert/weggenommen“ (z. B. +237 vs. −581)
- **Paarungen Rollen (M38):** Baseline + Server-Reset wieder nur mit Admin-Key; Spieler blenden lokal aus; klare UX „Hier ausblenden“ / „Server bereinigen“
- **2×/3× Alle Fünfe (M41):** Streak nur bei echtem Treffer (`score === 50`); Null-Einträge lösen keine Pool-Halbierung/-Nullung
- **Fortschritt 25/50/75 % (M37):** Delta nur aus Lobby-`diceScore` / Feldsumme — kein Fallback auf `totalScore`; bei Meilenstein frische Lite-Lobby vor Overlay
- **Paarung bearbeiten:** Baseline-Korrektur ohne Admin-API-Key (iOS ohne eingebetteten Key)
- **Fortschritt 25/50/75 %:** Punktdifferenz nur aus eingetragenen Feldpunkten (ohne oberen Bonus / Extra-Yatzy)
- **Statistik-Filter:** Paarungen bleiben sichtbar mit Alias / „Das bin ich“ (kein leerer Stats-Screen mehr)
- **Hamburger Rivalen/Tour:** Interne Menü-Ziele per `router.push` nach Menü-Schließen (nicht mehr Link+onClose) — verhindert Sprung auf den Startscreen in Capacitor
- **App-Tour aus Menü:** Startet die Overlay-Tour zuverlässig (Event + Pending), statt nur auf den Startscreen zu wechseln
- **Rivalen verknüpfen:** Beim Benennen unbekannter Gegner bestehende Rivalen auswählen (nicht nur neuer Name)

### Docs
- **HANDOVER / milestones_active / ios_current / milestones:** Stand HEAD `f5a2665`, Build 29, M36-Teilfortschritt Session-Flags

### Added
- **App-Tour:** Einstieg aus dem Hamburger-Menü (nicht mehr unter Einstellungen); Kapitel A/B/C weiter über `/app?tour=all`
- **App-Tour Kapitel A/B/C:** Start & Navigation, Strategy/Pool (Abweichungen zum klassischen Würfeln) und Statistik/Rivalen; Auto-Start verkettet alle Kapitel
- **App-Tour:** Geführte Tour beim ersten Start; Häkchen „nicht erneut anzeigen“; erneut startbar über das Menü
- **Rivalen verwalten:** Einstieg aus dem Hamburger-Menü und eigene Seite `/settings/rivals` (anlegen, umbenennen, löschen, zusammenführen); Link von der Statistik; nicht mehr unter Einstellungen
- **Rivalen-Profile:** Lokale Namen statt nur Alias; Statistik „Meine Rivalen“; unbekannt klar markiert; Migration bestehender Aliase

### Changed
- **Footer:** Tab-Label „Einstellungen“ → „Spielregeln“ (Link weiterhin `/settings`)
- **Rivalen verwalten:** Buttons „Zusammenführen“ / „Hier zusammenführen“ statt „Als Quelle“ / „mergen“
- **Startscreen Join-Code:** Höherer, cyan-abgesetzter Beitreten-Streifen (klarer Multi-Einstieg); Multi/Solo etwas niedriger; Motive in Multi/Solo skaliert, damit sie nicht abgeschnitten werden
- **Startscreen:** Multi-Kachel heißt „Multi-Spiel als Host starten“; kompaktes Code-Feld zum Beitreten zwischen Multi und Solo (ohne Scroll)
- **Hausregel Brennt:** Pool-Kosten pro Anwendung auf 1 reduziert (`BURN_POOL_COST`; zuvor 2, davor 5)
- **Statistik:** Paarungen als einklappbare Dropdowns auf `/stats` — Details, Runden und Bearbeiten inline; alte `/stats/pairing?key=…`-Links leiten um
- **Einstellungen:** Dezentes Perlgrau/Slate statt kräftigem Violett — zurückhaltende Karten, neutrale Akzente; Hausregeln nur leicht warm
- **Einstellungen:** Bereiche als einklappbare Dropdowns (Spielmodus, Visuelle Einblendungen, Solo, Multi, iPad-Tisch, Hausregeln) mit Kurz-Zusammenfassung im eingeklappten Zustand
- **Einstellungen:** Toggles global Grün (an) / Rot (aus) — auch in Settings-Karten ohne Slate-Override
- **Hamburger-Menü:** Seiten-Sheet von rechts mit Würfel-Branding, gestaffelten Karten-Einträgen und animiertem Icon (Burger → X)
- **Startscreen Bilanz-Dropdown:** 3D-Würfel skalieren beim Ausklappen dynamisch kleiner und kehren beim Zuklappen zur Originalgröße zurück
- **Doku:** `HANDOVER.md`, `docs/milestones_active.md`, `docs/ios_current.md`, `milestones.md` — UX-Politur II 2026-06-15
- **Spielanalyse:** Kompakter Kern („Warum verloren/gewonnen?“), Details eingeklappt; Duell-Graph alle 10 % statt pro Wurf
- **Fortschritt 25/50/75 %:** Hinweis vorn/zurück (ohne Abstand), Overlay per „Weiter“ wegklickbar
- **Statistik (A+B):** Kompakter Hero mit Bilanz, Siegquote und KPIs; Sortierung; Paarungs-Badges und Duellbalken
- **Startscreen Solo/Multi:** 3D-Würfel ohne Puls-Ring und Glow, ~30 % größer und zentrierter; nur noch der Card-Hintergrund
- **Screenshot:** Button „Bild“ in der Fußleiste; Kamera-Blitz, Vorschau vor dem Teilen, Toast statt Menü-Reopen; Hamburger mit Tour, Rivalen, Support und Rechtlichem

### Fixed
- **Statistik:** Badge „Top-Rivalität“ auf Paarungs-Accordions oben mittig statt links im Trigger
- **iPad-Tisch Namen:** Leere Eingabe bleibt leer (kein Zurücksetzen auf „Links“/„Rechts“); Fallback nur beim Spielstart

### Added
- **Hausregeln (Feature-Labor):** Brennt (−5 Pool), Wurf verkaufen (volle Feldzeile, 2–6 Spieler), 2× Alle Fünfe-Strafe (Gegner halber Pool)
- **Entwickler-Vorschau:** Code-Freischaltung (`NEXT_PUBLIC_LABS_PIN`), Labor unter `/settings/labs`, Feature-Register `featureFlags.ts`

### Fixed
- **Zusatzregeln:** Umbenennung von „Tischregeln“, dezenter Trigger rechts am Zettel statt voller Breite
- **Brennt:** Im Wurf-Overlay statt oberem Panel; Wurfbeginn = leeres Feld vor Eintrag (UI-Bug `rollsUsed === null` behoben)
- **Hausregeln am Zettel:** Helle Panel-Styles; oberer Bereich nur noch Zusatzregeln (Verkauf, 2× Alle Fünfe)
- **Eingabefelder:** `glass-input` nutzt feste dunkle Schrift auf hellem Grund (Code, Namen, Hausregeln) — zuvor helle Schrift auf weißem BG in dunklen Screens
- **iPad-Tischmodus:** Hausregeln (Brennt, Verkauf, 2× Alle Fünfe) im `TableModePlayBoard` — zuvor nur im normalen Spielscreen
- **Multi Eintrag Alle Fünfe:** Kein fixes Wurf-Limit pro Feld mehr (Strategy); Chips bis Pool + Restbudget; Hinweis wenn Würfel bei 50 Punkten fehlt

### Changed
- **Einstellungen (Ein-Screen):** Alle Toggles (Modus, Feedback, Multi, iPad, Hausregeln nach Code) in einer scrollbaren Liste; Solo- und Multi-Start direkt aus den Einstellungen; `/settings/feedback` und `/settings/labs` leiten auf die Hauptseite um
- **Zusatzregeln (Stufe B):** Verkauf und 2× Alle Fünfe im Wurf-Overlay (eingeklappt) und dezent rechts am Zettel; gemeinsame `HouseRulesTableActions`
- **iOS-Build:** `npm run build:ios` öffnet auf dem Mac nach `cap sync` automatisch `App.xcworkspace` in Xcode
- **Doku:** `HANDOVER.md`, `docs/milestones_active.md`, `docs/ios_current.md`, `GOiOS.md`, `milestones.md`, `docs/decisions.md` — Hausregeln, Feature-Labor, iOS Build 29

### Added
- **M29 Stats-Reset:** Nach `resetPairings` werden Ligapunkte betroffener Serien via `rebuildLeagueStandings` neu berechnet; UI-Hinweis in Statistik
- **M29 Match-Analyse:** `GET .../match-analysis` erfordert `X-Player-Secret` des Viewers oder Session-Status `FINISHED`; Frontend sendet Secret aus aktivem Spiel

### Security
- **M29 Dependencies:** Next.js 15.5.19 (Security-Patches, kritische Advisories behoben); Backend `npm audit fix` (transitive `qs`, 0 Findings)
- **Bekannt:** Frontend transitive `postcss` moderate (via Next.js) — kein sicherer Fix ohne Next-Major; statischer Export, kein Server-Rendering

### Added
- **M27 Frontend-Tests:** Playwright Smoke-Tests (`e2e/`, `npm run test:e2e`) — Solo, Multi-Join, Home `/app`
- **M27 Stabilität:** `AppErrorBoundary` für `/app`, `/play`, `/stats` mit Fallback zur Startseite
- **M27 Unit-Tests:** Node test runner für `gameScoring`, `pairingMerge`, `localSoloRun` (`npm run test`)

### Added
- **M26 Backend-Qualität:** Zentrales `sortFields`/`isRunTerminal`; Run-Status `ABANDONED`; `InvalidYatzyDieValueError`; API `/player-names/aliases`
- **M26 Tests:** Supertest-Setup (`httpSetup.ts`), Route-Tests runs/sessions/stats
- **M26 Doku:** `backend/openapi.yaml`, `backend/README.md`, ESLint-Config

### Added
- **M25 Performance:** `getRunById` ein Query ohne Read-Backfill; Backfill-Skript `npm run db:backfill-scored-sequences`
- **M25 Performance:** Run-Erstellung mit `field.createMany` pro Spiel; Indizes `Run.status`, `GameSession.pointsAwarded`
- **M25 Performance:** `getStats` per DB-Aggregation; Pairing-Stats In-Memory-Cache (TTL 60s, Invalidierung bei reset/baseline)

### Fixed
- **M24 Zoom:** Settings, Statistik und Legal — `useFixedViewport` blockierte Pinch/Trackpad-Zoom per JS und `touch-action`; jetzt `allowPinchZoom` / `zoomable-route`

### Added
- **M24 Pool-Endspiel:** Ereignisbasiertes Session-Reload für Nicht-Sieger (Focus/Visibility, Abschluss-Übergang) — kein Polling; Loading-Hinweis „Session wird aktualisiert…"
- **M24 a11y:** Skip-Link „Zum Inhalt" auf Home und Settings; Fokus-Falle in `PoolEndgamePanel` und `AchievementOverlay`; Zoom in Settings/Statistik/Legal (Pinch-Zoom nur noch auf Spiel-Routen)
- **M24 Betrieb:** Einmal-Skript `infra/scripts/verify-prod-api.sh` (Health, Migration, match-analysis, Cache-Header)

### Docs
- **HANDOVER/Roadmap:** M24 umgesetzt; Prod-Verifikation und nginx-Reload dokumentiert

### Added
- **M23 Sicherheit:** Admin-Auth (`X-Admin-Key`) für `POST /stats/pairings/reset` und `/baseline`; Env `ADMIN_API_KEY` / `NEXT_PUBLIC_ADMIN_API_KEY`
- **M23 Rate-Limiting:** max. 30 req/min/IP auf Run-/Session-Erstellung und Join
- **M23 Solo-Secret:** `POST /runs` liefert `soloSecretToken`; API-Runs schützen Schreibzugriffe per `X-Player-Secret` (Legacy-Runs ohne Token bleiben offen)
- **M23 Join-Duplikat:** gleiche `playerId` kann Session nicht zweimal belegen (409)
- **M23 Betrieb:** Graceful Shutdown (`SIGTERM`/`SIGINT`), `helmet`, JSON-Body-Limit 100 KB
- Migration `20260611120000_solo_secret_token`

### Changed
- **Doku:** HANDOVER (kurzer Agent-Start-Prompt), `docs/milestones_active.md`, `docs/ios_current.md`, `milestones.md`, `GOiOS.md` — Stand `d8b5952`, TestFlight `2.0 (28)`, Cinematic Editorial Startscreen
- **Startscreen Cinematic Doors:** Multi und Solo als gestapelte Einstiegstore (Vorschlag 3) — Bilanz/Stats per Glas-Chip aufklappbar; Entrance-Animation; klassisches Arena-Layout bleibt als `HomeBentoGridClassic` per `NEXT_PUBLIC_HOME_LAYOUT=classic` oder `bash infra/scripts/set-home-layout.sh classic` wiederherstellbar; Browser-Override: `localStorage dicebudget.homeLayout`
- **Startscreen Editorial Portal:** Cinematic-Kacheln als Vollflächen-Poster — große Modus-Typo, ein Mini-Chip, Würfel-Hero mit Rand-Überhang, Glas-CTA („Lobby öffnen“ / „Run starten“)
- **Startscreen Editorial:** CTA links unter der Copy integriert (Glas-Pill in Kartenfarben, ohne separaten Dock-Streifen); Würfel-Bühne bleibt rechts getrennt
- **Doku:** TestFlight `2.0 (27)` als aktueller Stand (Upload erledigt); offene Prioritäten ohne erneuten iOS-Build; Referenz-Workflow für künftige Uploads
- **Doku:** HANDOVER, `docs/milestones_active.md`, `docs/ios_current.md`, `milestones.md`, `GOiOS.md` — Stand `66e8487`, iOS-Workflow mit `build:ios`-Pflicht, TestFlight `2.0 (27)`, Hinweis zu wirkungslosem Upload `2.0 (26)`
- **Footer-Menü:** Dezenterer Hamburger-Trigger; Menü-Panel mit stärkerem Glas-Look (Blur, halbtransparent, weichere Typo)
- **Startscreen Arena:** Zwei gleichwertige Kacheln ohne Mittel-Logo; zentrierte Texte, dominante 3D-Würfel-Icons (Multi/Solo) im Kachelzentrum
- **Startscreen Arena:** Zwei Vollbild-Kacheln (Multi vs. Solo) mit Aurora-Hintergrund, schwebenden 3D-Icons, Glow-Ring, Glas-Dock und Play-CTAs („Lobby öffnen“ / „Run starten“); kompakter Hero „Wähle deinen Modus“
- **Footer-Tabbar:** `Home · Statistik · Einstellungen · Menü` — Hamburger-Menü mit Screenshot teilen, Support, Datenschutz, Impressum, bottle-trade.de (via `AppFooterMenu`, `html-to-image`)
- **Footer-Menü:** Schriftgröße „Menü“ an andere Footer-Labels angeglichen
- **Startscreen:** Nur noch zwei große Kacheln (Multiplayer + Einzelspiel); Statistik und Einstellungen nur noch im Footer
- **Intro-Splash:** DiceBudget-Logo mittig über dem App-Namen; Schreibweise überall **DiceBudget**; Intro-Key `v2` (Splash einmalig nach Logo-Update)
- **Deploy/Nginx:** `Cache-Control: no-cache` für HTML; `_next/static/` mit `immutable` — behebt veraltete UI in Safari nach Frontend-Deploy (nginx reload durch Nutzer)
- **Multi: Raum-Code teilen:** System-Share und Zwischenablage liefern nur noch den Code — ohne Einladungstext oder App-Link (WhatsApp-Kopieren)
- **Erfolgs-Animationen:** Bonus, Große Straße, Alle Fünfe und untere Spalte voll feiern über den gesamten Bildschirm — größere Karte, Würfel, Ring, Schockwellen, Strahlen und Konfetti
- **Multispiel-Abschluss & Spielanalyse:** Card-Dashboard mit klar getrennten Bereichen — Ergebnis, Ranking, Teilen, Statistik-Toggle, Spielblöcke, Pool, Aktionen; Analyse mit Sektionen, Kennzahlen-Karten, getrennten Stärken/Schwächen- und Coaching-Cards

### Added
- **Zettel: Ergebnis-Zeilen in Feld-Spalte:** Die Label-Zellen „Ergebnis 1“, „Ergebnis 2“ und „Ergebnis Spiel“ nutzen dieselben Hintergrund- und Schriftfarben wie die Wertezellen in den Spielspalten (dunkel bzw. grün hervorgehoben)
- **Multi: Raum-Code teilen:** Nach dem Anlegen eines Raums ersetzt „Code teilen“ das Kopieren — System-Share mit Einladungstext (Fallback: Zwischenablage)
- **Fortschritt 25 / 50 / 75 %:** Kurzes Overlay und Sound, wenn ein Viertel der Felder eines Laufs eingetragen ist (Solo, Multi, iPad-Tischmodus); erscheint auch nach Erfolgs-Overlays (z. B. Alle Fünfe) nacheinander
- **Spiel-Feedback granular:** Unter `/settings/feedback` einzeln schaltbar: Erfolgsanimationen, Sounds, Fortschrittshinweise
- **Spielanalyse: Punkte-Duell-Graphik (Multi):** Nach Multi-Spielen zeigt die Analyse einen SVG-Verlauf der Gesamtpunkte von Spieler 1 vs. Spieler 2 (Session-Reihenfolge) — Führungswechsel und farbige Linien im Koordinatensystem. Backend: `scoreProgression` in `GET /sessions/invite/:code/match-analysis` (Feld `scoredSequence` pro Eintrag)
- **Spielanalyse-Coaching (Multi):** Regelbasierte Auswertung mit Narrative (Sieg/Niederlage), Stärken/Schwächen, Pool-Report (Strategy), Feld-Differenzen, bis zu 3 Tipps; UI im dunklen App-Dashboard-Design mit klaren Sektionen (Warum · Profil · Pool · Felder · Nächstes Mal · Details)
- **Einstellungen: Rücknavigation** — Von `/solo` und `/multi` öffnet „Einstellungen“ mit `?from=solo|multi`; auf `/settings` erscheint „Zurück zu Einzelspiel/Multiplayer“ statt Umweg über den Startscreen
- **Spiel-Feedback (Erfolgs-Overlays + Sound):** Einheitliches `AchievementOverlay` bei Bonus, unterer Spalte voll, Große Straße (40 Pkt.) und Yatzy (50 Pkt.) — typabhängige Farben, Konfetti, Würfel-Motive; synthetisierte Web-Audio-Sounds; Toggle „Spiel-Feedback“ in Einstellungen (ersetzt „Bonus-Einblendung“)
- **Spielanalyse (Head-to-Head):** Nach Multi-Abschluss optional „Spielanalyse“ — abgeleitete Kennzahlen (Attribution, Pool-Effektivität, Yatzy, entscheidender Block/Feld). **2 Spieler:** ein Head-to-Head wie bisher. **3–6 Spieler:** Runden-Ranking, Direktvergleich vs. jeden Mitspieler, Platz/Differenz zur Spitze. Solo analog. Nachträglich unter `/stats/pairing`. Backend: `GET /sessions/invite/:code/match-analysis`
- **Multiplayer: Werten / Nicht werten:** Auf dem Ergebnis-Screen (und beim Verlassen aus der Zettelansicht) steht ein Toggle „Werten“ / „Nicht werten“. Erst beim Verlassen zur Startseite wird die Session finalisiert; bei „Werten“ fließen Liga- und Paarungs-Statistik ein, bei „Nicht werten“ nicht (`include_in_pairing_stats` auf `GameSession`, Endpoint `POST /sessions/invite/:code/finalize-stats`). Bestehende Sessions bleiben durch Default `true` kompatibel
- **Yatzy-Würfel-Strichliste:** Beim Eintrag eines Yatzy (50 Punkte) fragt das Overlay die Augenzahl (1–6) ab; auf dem Zettel erscheint hinter dem passenden Würfel eine Markierung als kleiner Würfel. Beim Zusatz-Yatzy (+100) ebenfalls Würfelwahl vor dem Bonus. Backend: `fields.yatzy_die_value`, `games.extra_yatzy_die_values` (Migration)
- **iPad-Tischmodus (2 Spieler auf einem Gerät):** Beim Erstellen eines Mehrspieler-Raums kann der Host optional „iPad-Tischmodus" aktivieren. Die App erstellt dann bewusst ein 2-Spieler-Spiel, nimmt lokal zwei Spieler-Slots in denselben Raum auf und öffnet `/play?table=1` mit zwei nebeneinanderliegenden, anklickbaren Zetteln für iPad-Querformat. Die Namen für linken/rechten Spieler sind beim Erstellen eingebbar und werden lokal als Aliase für Anzeige/Statistik-Zuordnung gespeichert. Normale iPhone-/Multiplayer-Routen bleiben unverändert. Gegner-Pool und Pool-Endspiel bleiben wählbar; das Pool-Endspiel ist im Tischmodus direkt auf dem Zwei-Zettel-Screen auflösbar. Dateien: `frontend/app/multi/page.tsx`, `frontend/app/play/page.tsx`, `frontend/components/TableModePlayBoard.tsx`, `frontend/lib/tableMode.ts`, `frontend/lib/activeGame.ts`, `frontend/app/globals.css`
- **Paarungen bearbeiten (M35, serverseitig):** Auf der Paarungs-Detailseite (`/stats/pairing`) lässt sich eine Paarung über „✏️ Paarung bearbeiten" anpassen: **Siege je Spieler** und eine **Netto-Punktedifferenz** (Eingabe von Betrag + bevorzugter Seite). Hintergrund: außerhalb der App gespielte Partien nachtragen. Die Statistik zeigt fortan **eine kombinierte Gesamtübersicht** (App-Runden + manuell nachgetragene Werte zusammen); die Differenz wird **netto** angezeigt (Plus nur auf der führenden Seite, andere Seite leer). Reaktiviert die bestehende Tabelle `pairing_manual_baselines` (**keine neue Migration**); Backend rechnet sie in `accumulatePairings()` ein (nur Gesamtwerte, App-Werte bleiben Untergrenze), neuer Endpunkt `POST /stats/pairings/baseline` (`upsertPairingBaselines()`), „Statistik zurücksetzen" löscht zugehörige manuelle Werte mit. **Wird auf allen Geräten gespeichert; ohne Auth.** Dateien: `backend/src/services/pairingStats.ts`, `backend/src/routes/stats.ts`, `frontend/lib/pairingTypes.ts`, `frontend/lib/normalizePairing.ts`, `frontend/lib/pairingMerge.ts` (`buildBaselineWrites`), `frontend/lib/api.ts`, `frontend/components/PairingEditOverlay.tsx` (neu), `frontend/app/stats/pairing/page.tsx`, `frontend/components/PairingSummaryCard.tsx`
- **Statistik zurücksetzen (serverseitig):** In der Paarungs-Übersicht (`/stats`) lassen sich über „Statistik zurücksetzen" einzelne Paarungen auswählen und nach Bestätigung **endgültig** löschen. Backend löscht die zugehörigen abgeschlossenen 2-Spieler-Sessions inkl. Runs/Games/Fields/Rolls (`resetPairings()`, neuer Endpunkt `POST /stats/pairings/reset`). Mehr-Spieler-Sessions werden zum Schutz anderer Paarungen nicht angetastet (gemeldet als `skippedMultiPlayer`). **Destruktiv, betrifft alle Geräte.** Hinweis: Serien-/Liga-Punkte (`LeagueStanding`) werden dadurch nicht rückwirkend neu berechnet. Dateien: `backend/src/services/pairingStats.ts`, `backend/src/routes/stats.ts`, `frontend/lib/api.ts`, `frontend/app/stats/page.tsx`, `frontend/components/PairingSummaryCard.tsx`
- **Bonus-Konfetti-Regen:** Beim Erreichen des oberen Bonus regnet im Glückwunsch-Overlay (`BonusOverlay`) kurz Konfetti hinter der Karte – nur solange das Overlay eingeblendet ist (verschwindet automatisch mit). Reines CSS (`.bonus-confetti*` in `globals.css`), respektiert `prefers-reduced-motion`, keine neue Abhängigkeit
- **Support-Link im Start-Footer:** Auf dem App-Start (`HomeBentoGrid`) neben „Datenschutz" und „Impressum" ein dritter Link „Support" (`mailto:` an `CONTACT_EMAIL` mit Betreff „dice.budget Support") — öffnet das Standard-Mailprogramm
- **M33 Pool-Endspiel (Multiplayer):** Host-Toggle „Pool-Endspiel" beim Raum-Erstellen (nur Strategy). Sobald alle Runs beendet sind, darf der Spieler mit dem eindeutig größten Wurf-Pool **ein** Feld verbessern: Feld antippen → neuen Wert eintragen oder „Alten Wert behalten". Erst danach werden Liga-Punkte vergeben und die Session beendet. Bei Gleichstand an der Spitze verbessert niemand. Backend: Session-Felder `pool_endgame_enabled` / `pool_endgame_improver_id` / `pool_endgame_resolved` (Migration), neuer Endpunkt `POST /sessions/invite/:code/pool-endgame`, Sieger-Bestimmung `determinePoolEndgameImprover()`. Frontend: `PoolEndgamePanel`, Improver-Phase in `PlayBoard`. Kein Polling (Auflösung ereignisbasiert beim Öffnen des Abschluss-Screens)
- **M32 Gegner-Pool (Multiplayer):** Host-Toggle „Gegner-Pool sichtbar" beim Raum-Erstellen; bei genau 2 Spielern zeigt die Spiel-Topbar den Wurf-Pool des Gegners. Backend: Session-Flag `show_opponent_pool` (Migration), Lobby-DTO um `rollsInPool` je Spieler erweitert. Kein Polling (Nachladen nur bei Start + eigener Eintragung)
- **M31 Bonus-Einblendung:** kurzes Glückwunsch-Overlay mit Animation, wenn eine obere Reihe 6/6 mit ≥63 abschließt; Auto-Close 2,5 s; Geräte-Toggle (`lib/uiPrefs.ts`, `BonusCelebrationToggle`) auf `/solo` + `/multi`; `BonusOverlay`, `upperBonusAchieved()`
- **M30 Bonus-Delta-Anzeige:** Zeile „Ergebnis 1“ zeigt pro Spielblock das laufende Delta zur Soll-Marke „3 je Augenzahl“ (Bonus 63). `+` in Grün (über Schnitt), `−` in Rot (unter Schnitt), `±0` in Grau. Helfer `upperBonusDelta()` in `frontend/lib/gameScoring.ts`, Anzeige in `ScoreSheetTable`
- **M29 Punktwahl-Eintrag:** Feld antippen → Overlay mit feldtypabhängiger Punktwahl + Würfe → Eintragen (`FieldScoreChoiceGrid`, `ScoreEntryPanel`)

### Fixed
- **Fortschritt nach Erfolgs-Overlay:** 25/50/75 %-Hinweis erscheint jetzt auch, wenn zuvor eine Erfolgsanimation (z. B. Alle Fünfe) lief — nacheinander über `feedbackOverlayQueue.ts`
- **Yatzy-Strichliste am Würfel:** Markierung neben der Augenzahl sind kleine Würfel (50 % der Feld-Würfelhöhe) mit der tatsächlichen Augenzahl; ab dem 6. Yatzy pro Augenzahl Umbruch in die nächste Zeile (max. 5 pro Zeile), damit nichts in die Wertespalten ragt
- **Zusatz-Yatzy-Auswahl:** Popover per Portal über den Zettel (`ExtraYatzyPickerOverlay`) — Fix für Abschneiden durch `overflow: hidden` und `FitScoreSheet`-Skalierung
- **Multi-Abschluss „Internal Server Error“:** Beim Klick „Spiel beenden“ auf `finalize-stats` schlug die Session bei nur einem Spieler im Multi-Raum oder offenem Pool-Endspiel fehl; `SessionNotReadyError` wurde nicht im Error-Handler abgefangen (500). Jetzt Abschluss ab einem Spieler, Paarungs-Statistik erst ab zwei, **409** mit deutscher Meldung, Fehlertext auf `RunFinishScreen`. Dateien: `backend/src/services/sessionService.ts`, `backend/src/middleware/errorHandler.ts`, `frontend/components/RunFinishScreen.tsx`
- **Statistik-Button-Kontrast:** Helle `btn-chip`-Buttons im Statistikbereich nutzen nun eine dunkle Schriftfarbe, damit `Paarung bearbeiten` und Alias-Buttons auf weißem Button-Hintergrund lesbar bleiben. Datei: `frontend/app/globals.css`
- **Startscreen-Scroll in iOS-WebView:** Der Startscreen nutzt jetzt einen echten internen `100dvh`-Scrollport (`home-screen`) statt Body-Scroll. Dadurch kann die Home-WebView in iOS/Capacitor zuverlässig vertikal scrollen; `Statistik` und `Einzelspiel` haben zusätzlich mehr Abstand zwischen Motiv und Text. Dateien: `frontend/components/HomeScreenShell.tsx`, `frontend/app/globals.css`
- **Startscreen auf iOS scrollfähig:** Der neue Game-Dashboard-Startscreen war in der alten starren Bento-Höhe zu eng; kleine Kacheln (`Statistik`, `Einzelspiel`) wurden gequetscht und `Raum beitreten` konnte unten angeschnitten werden. Nur der Startscreen ist jetzt vertikal scrollbar, der innere Home-Main blockiert Scrollen nicht mehr, und die Kacheln nutzen stabile Mindesthöhen mit mehr Abstand zwischen Motiv und Text; Spielzettel, Setup- und Play-Screens bleiben unverändert starr. Dateien: `frontend/components/HomeScreenShell.tsx`, `frontend/components/HomeBentoGrid.tsx`, `frontend/app/app/page.tsx`, `frontend/app/globals.css`
- **Punktwahl-Markierung gelb gefüllt:** Im Eintrags-Overlay war der gewählte **Punktwert** nur schwach gelb umrandet (die weiße Grundfläche der `field-score-*-btn` überschrieb wegen gleicher CSS-Spezifität die gelbe Füllung von `play-score-btn--selected`). Jetzt wird der gewählte Wert **gelb ausgefüllt** – genau wie die Auswahl der Würfe-Anzahl. Höher spezifische Regel in `globals.css`
- **Paarungs-Detail in der iOS-App (Capacitor-Fix):** Tippen auf eine Paarung führte in der nativen App zum Start-Screen statt zur Detailansicht. Ursache: die Karte navigierte per normalem `<a href>` (voller Reload), den Capacitor ohne `.html`-Auflösung auf `index.html` → `NativeAppEntry` (Redirect zum Start) zurückfallen ließ. Jetzt clientseitige Navigation via `next/link`. Datei: `components/PairingSummaryCard.tsx`
- **Pool-Endspiel ausführbar (M33-Fix):** Beendete der Pool-Sieger seinen Run **vor** den Mitspielern, erschien die Verbesserungs-Phase nie (ohne Polling kein Nachladen). Der Abschluss-Screen zeigt jetzt „Pool-Endspiel läuft" mit Aktualisieren-Tap; zusammen mit dem Focus-Refresh erhält der Sieger die Verbesserung zuverlässig. Datei: `PlayBoard.tsx`
- **Stats zusammenführen bei Alias:** Spieler-IDs mit demselben lokalen Alias werden in der Statistik wieder als dieselbe Person zusammengeführt (Übersicht + Detail), rein lokal/clientseitig ohne Klarnamen. Neu: `lib/pairingMerge.ts`; angepasst: `app/stats/page.tsx`, `app/stats/pairing/page.tsx`

### Added
- **Erfolg teilen (Canvas-Karte):** PNG-Share-Karte mit App-Branding; eingesetzt auf **Spielende** und **Startscreen-Bilanz** (Scope seit `9f120f5`/`de0f8f2` reduziert)

### Changed
- **Startscreen-Bilanz:** Große Share-Leiste („Bilanz teilen“ mit WhatsApp/Instagram) entfernt — stattdessen kompakter **Teilen**-Button in der Bilanz-Zeile (System-Teilen mit Bilanz-Bild als PNG)
- **Teilen nur Spielende + Bilanz:** Share-Buttons aus Erfolgs-Overlays (Bonus, Ergebnis 2/unten voll, Große Straße, Alle Fünfe), Spielanalyse, iPad-Duell-Abschluss und Paarungs-Detail entfernt; Teilen bleibt auf `RunFinishScreen` und Startscreen-Bilanz
- **Teilen vereinfacht:** WhatsApp-/Instagram-Separat-Buttons entfernt — direkter App-Sprung mit Bild ist aus Web/Capacitor nicht zuverlässig; ein **Teilen**-Button nutzt System-Share (iOS/Android) bzw. Bild-Download als Fallback
- **Spiel-Feedback Gaming-Politur II:** Deutlich reichere Erfolgs-Overlays (Aurora-Hintergrund, Schockwellen, Orbit-Partikel, typ-spezifische Szenen: Münzregen/Bonus, Hex-Grid/unten voll, Blitze/Große Straße, Jackpot-Strahlen + Krone/Alle Fünfe) und aufwändigere Web-Audio (Shimmer-Arpeggios, Power-Up-Kaskaden, Jackpot-Fanfare)
- **Markenwort „Yatzy“ entfernt:** Nutzer-sichtbare Texte heißen jetzt **Alle Fünfe** (Zettelzeile, Eintrag, Zusatz-Bonus, Spiel-Feedback, Spielanalyse/Coaching, Fehlermeldungen)
- **Spiel-Feedback Gaming-Politur:** Erfolgs-Overlays im dunklen Dashboard-Look (Glas-Karte, Gold-Kicker, typ-spezifische Szenen: obere Sektion-Slots, Ring-Siegel, Combo-Würfelkette, Alle-Fünfe-Shake/Flash); Layered Web-Audio mit Riser, Kicks, Stereo-Panning und Noise-Bursts; „Außerhalb tippen zum Schließen“
- **Bonus-Einblendung → Spiel-Feedback:** Einstellungs-Toggle steuert jetzt alle Erfolgs-Animationen und Sounds (lokal, gleicher Storage-Key)
- **Multi-Statistik-Toggle wie Einstellungen:** „Werten“ / „Nicht werten“ nutzt jetzt denselben Switch (`.app-toggle`) und Karten-Stil wie die Toggles unter `/settings`
- **Spielzettel Ergebnis 1/2 dunkel:** Zeilen- und Zellenhintergrund von „Ergebnis 1“ und „Ergebnis 2“ an den dunklen Spielzettel angeglichen (kein Hellgrau mehr)
- **Toggles blassgrün/blassrot:** Einheitliche `.app-toggle`-Klasse auf Settings, Setup und Strategy/Bonus-Toggles
- **Startscreen-Icons +75 %:** 3D-PNG-Motive in den Hauptkarten vergrößert (`globals.css`)
- **Einstellungen gruppiert:** Bereiche Allgemein, Solo, Multi und iPad mit sichtbaren Gruppenüberschriften; iPad-Spielernamen nur bei aktivem iPad-Tisch editierbar
- **Spielzettel ohne Footer:** Die eigentliche `/play`-Ansicht rendert keine Footer-Tabbar mehr und nutzt eine volle Inhaltszeile, damit Solo- und Multiplayer-Zettel den gesamten Screen zum Eintragen bekommen. Setup-, Home-, Legal- und Statistik-Screens behalten den Footer. Dateien: `frontend/components/FixedScreenShell.tsx`, `frontend/app/globals.css`
- **Datenschutz/Impressum an App-Screens angeglichen:** Die Legal-Seiten nutzen jetzt dieselbe feste App-Aufteilung mit dunklem Hintergrund, gemeinsamem Screen-Header, scrollendem Contentbereich und der Footer-Tabbar unten. Eigene obere Zurück-Buttons und interne Legal-CTAs wurden entfernt. Dateien: `frontend/components/LegalScrollShell.tsx`, `frontend/app/datenschutz/page.tsx`, `frontend/app/impressum/page.tsx`, `frontend/components/AppScreenHeader.tsx`, `frontend/app/globals.css`
- **Startscreen-Motive als 3D-Icon-Assets:** Die vier Hauptkarten (`Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`) nutzen jetzt die neuen transparenten 3D-Icons aus `frontend/public/home-icons/` statt inline-SVG-Motiven. Die Darstellung bleibt per Max-Hoehen und Small-Viewport-Regeln im Gesamtbild der Kacheln. Dateien: `frontend/components/HomeBentoGrid.tsx`, `frontend/public/home-icons/*.png`, `frontend/app/globals.css`
- **App-Footer als dunkle Bottom-Tab-Bar:** Die feste Footer-Zeile ist nun eine dunkle, pillenfoermige Tab-Bar mit vier gleich breiten Bereichen (`Home`, `Datenschutz`, `Impressum`, `Support`) und dezenten SVG-Line-Icons. Dadurch laeuft der Footer auf iPhone-Breite nicht mehr seitlich aus. Weiterhin kein `safe-area-inset-bottom`, damit iOS die Links nicht nach oben schiebt. Dateien: `frontend/components/AppLegalFooter.tsx`, `frontend/app/globals.css`
- **Home-Link in den festen Footer verlagert:** Setup-/Stats-/Settings-/Join-Screens verzichten auf den oberen `Startseite`-Button; im Solo-Spielzettel verschwindet der obere Startseiten-Link ebenfalls. Stattdessen steht `Home` links vor `Datenschutz` im zentralen App-Footer. Dadurch rückt der Screen-Content um die bisherige Buttonhöhe nach oben und gewinnt vertikalen Platz. Dateien: `frontend/components/AppScreenHeader.tsx`, `frontend/components/AppLegalFooter.tsx`, `frontend/components/PlayTopBar.tsx`, `frontend/app/multi/join/page.tsx`
- **Statistik-Paarungskarten im App-Design:** Die Gegenüberstellungs-Cards auf `/stats` verwenden jetzt die dunkle Dashboard-/Stats-Farbwelt mit Anthrazit, warmem Gold-Akzent und hellen Textkontrasten statt des bisherigen hellen Rosa/Violett-Verlaufs. Datei: `frontend/app/globals.css`
- **Multiplayer-Abschluss ohne Statistik-Abzweig:** Im normalen Multiplayer wird der eigene Run nach dem letzten Feldeintrag automatisch abgeschlossen. Ohne Pool-Endspiel erscheint direkt das Ergebnis mit „Spiel beenden und zur Startseite" und „Zettel ansehen"; in der Zettelansicht bleibt nur der Startseiten-Button. Bei aktiviertem Pool-Endspiel wird nach dem automatischen Abschluss gezielt die Lobby aktualisiert, sodass der Pool-Sieger direkt seine Verbesserungsphase erhält, sobald der Server sie freigibt. Abschluss- und Tischmodus-Screens verlinken von dort nicht mehr zur Lobby/Rangliste. Dateien: `frontend/components/PlayBoard.tsx`, `frontend/components/RunFinishScreen.tsx`, `frontend/components/TableModePlayBoard.tsx`
- **App-Footer und dunkle graue UI finalisiert:** Home-, Setup- und Play-Shells nutzen jetzt ein zweizeiliges Grid (`Content` + fester Footer) statt Overlay-Footer mit Verlauf. Datenschutz/Impressum/Support stehen als klare Footer-Zeile am unteren Viewport-Rand; Content scrollt nur im oberen Bereich. Der Footer verzichtet bewusst auf `safe-area-inset-bottom`, damit iOS die Links nicht wieder nach oben schiebt; die Zeile ist kompakt mit 2px Innenabstand oberhalb/unterhalb der Links. Der App-Hintergrund ist nun ein dunkles Grau und alle iOS-`themeColor`-Fallbacks sind darauf abgestimmt. Settings-Toggles zeigen rechts in der Card klar Grün (`an`) oder Rot (`aus`). Dateien: `frontend/components/AppLegalFooter.tsx`, `frontend/components/HomeScreenShell.tsx`, `frontend/components/FixedScreenShell.tsx`, `frontend/components/HomeBentoGrid.tsx`, `frontend/components/SetupScreenLayout.tsx`, `frontend/app/globals.css`
- **Startscreen + zentrale App-Einstellungen:** Der Startscreen zeigt nun vier klare Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik` und `Einstellungen`. `Raum beitreten` ist in `/multi` integriert, `Raum erstellen` heißt auf dem Startscreen jetzt `Multiplayer`. Solo-/Multiplayer-Optionen wie Spielanzahl, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus werden zentral unter `/settings` gepflegt und als Defaults genutzt. Der Startscreen ist wieder ein fester Dashboard-Screen ohne Scrollbereich; Footer bleibt unten das letzte Element. Die Farbwelt wurde von Neon/Pink/Lila/Cyan auf eine ruhigere Premium-Gaming-Palette aus Dunkelblau, Anthrazit, Petrol und Gold/Kupfer umgestellt. Dateien: `frontend/components/HomeBentoGrid.tsx`, `frontend/components/HomeScreenShell.tsx`, `frontend/app/app/page.tsx`, `frontend/app/settings/page.tsx`, `frontend/app/settings/layout.tsx`, `frontend/app/multi/page.tsx`, `frontend/components/GameSetup.tsx`, `frontend/lib/uiPrefs.ts`, `frontend/app/globals.css`
- **Startscreen-Bilanz statt Level-Balken:** Der bisherige Platzhalter-Fortschrittsbalken auf dem Startscreen wurde durch eine Sieg/Niederlagen-Bilanz ersetzt. Die Anzeige nutzt die lokal zusammengeführten Paarungsdaten und summiert gewonnene/verlorene Spiele für die lokale Spieler-ID; falls diese nicht in historischen Paarungen vorkommt, nimmt sie einen lokal benannten Statistikspieler als Perspektive (z. B. „Marc Bilanz"). Der Balken zeigt das Verhältnis als grün/magenta Split. Dateien: `frontend/components/HomeBentoGrid.tsx`, `frontend/app/globals.css`
- **Startscreen-Partien zählen Paarungs-Spiele:** Der Header-Wert „Paarungs-Spiele" kommt jetzt aus `/stats/pairings`, wird lokal mit denselben Alias-Regeln wie die Statistikseite zusammengeführt und summiert `roundsPlayed` über alle Paarungen. Dadurch zählt z. B. `Marc vs. Nicole 48:62` als 110 und `Marc vs. Malte 0:3` als 3 statt nur globale App-Runs aus `/stats`. Datei: `frontend/components/HomeBentoGrid.tsx`
- **Setup- und Lobby-Unterseiten im Game-Dashboard-Look:** `/solo`, `/multi` und `/multi/join` übernehmen die neue hochwertige Startscreen-Optik mit dunklem Strategiespiel-Hintergrund, farbigen Hero-Headern, Glas-/Glow-Karten, moderneren Slidern/Toggles und Lobby-Karten. Die Formularlogik, Routen, API-Aufrufe und der eigentliche Spielzettel bleiben unverändert. Dateien: `frontend/components/AppScreenHeader.tsx`, `frontend/app/multi/join/page.tsx`, `frontend/app/globals.css`
- **Startscreen als Game-Dashboard:** Der App-Start wirkt jetzt stärker wie ein modernes Strategiespiel: emotionalerer Hero-Header mit Statistik-Chips/Fortschritt, kontrastreiche Farbwelten je Hauptfunktion, Mini-Poster-Kacheln mit eigenen SVG-Motiven für Raum erstellen, Statistik und Einzelspiel sowie ein modernerer Lobby-Code-Bereich für „Raum beitreten“. Die bestehenden Hauptfunktionen, Routen und Join-Logik bleiben unverändert. Dateien: `frontend/components/HomeBentoGrid.tsx`, `frontend/app/globals.css`
- **Spielzettel Ergebnis-Zeilen moderater:** Die Ergebnis-Zeilen im Spielzettel sind nur noch moderat höher als die Eintragsfelder. „Ergebnis 1“ hebt den Hauptwert und besonders den Bonus-Delta-Wert (`+/-`) deutlicher hervor, ohne die Zeile weiter aufzublähen. Dateien: `ScoreSheetTable.tsx`, `globals.css`
- **Spielzettel füllt die volle Höhe:** Bisher kappte `FitScoreSheet` den Zettel auf seine (kurze) Inhaltshöhe → unten blieb Platz ungenutzt. Jetzt füllt der Zettel die **volle verfügbare Bildschirmhöhe**: die Zeilen wachsen mit, die **Ergebnis-Zeilen** (Ergebnis 1, Zwischensumme, Ergebnis Spiel) sind etwas höher als die Würfe-/Feld-Zeilen. Passt sich automatisch an das iPhone-Format an. Bei zu wenig Platz (sehr kleine/quere Screens) wird weiterhin herunterskaliert (kein Seiten-Scroll, M20-Garantie). Dateien: `FitScoreSheet.tsx`, `ScoreSheetTable.tsx`, `globals.css` (`.play-score-table`-Höhenverteilung)
- **Gegner-Pool aktualisieren (M32-Fix):** Der Gegner-Pool wird jetzt auch bei App-Rückkehr (`visibilitychange`/`focus`) und über einen dezenten Aktualisieren-Tap in der Spiel-Topbar neu geladen. Behebt, dass der Host (zuerst im Spiel) den später beitretenden Gegner ohne Polling nie sah. Weiterhin kein Polling (nur gezielte Einzel-Requests). Dateien: `PlayBoard.tsx`, `PlayTopBar.tsx`, `globals.css`
- **Eintrag-Voreinstellung:** Würfe-Standard im Strategy-Modus von 2 auf **3** geändert (`PlayBoard.defaultRollsUsed`)
- **M32 Topbar:** „Rest"-Chip (Restwürfe bis Spielende) entfernt — Topbar zeigt nur noch den eigenen Pool
- **M29 UX (final):** Overlay startet oben; obere Felder nur Zahlen (0, 2, 4, …); gewählte Punkte/Würfe hellgelb markiert
- **M29 entfernt:** Würfel-Zähler, Wurf vergleichen, `DiceThrowOverlay`, `CommittedThrowBanner`, `FixedFieldChoiceBanner`

### iOS
- App Store Connect ist bei **Version 2.0**; aktueller TestFlight-Build **2.0 (21)** (Upload durch Nutzer). Build-Nummern zählen pro Versionsstring · nächster Upload = **2.0 (22)** mit Alle-Fünfe-UX, Share, Branding, Spiel-Feedback Gaming, Coaching-Analyse, Einstellungen-Rücknavigation (seit `a93e462`)
- M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard + Spiel-UX + Spielanalyse (Basis) sind in **2.0 (21)**; alles seit `48a65f1`/`3c03592`/`a93e462` noch nicht im iOS-Build
- (zuvor, Version 2.0) Build **6** — vor M34-Fixes · (Version 1.0) Build **18** — M33 + Würfe-Standard 3 · **17** — M31 + M32 · **16** — M29 + M30 · **15** — M29

### Docs
- HANDOVER, milestones, CHANGELOG: Übergabe auf Produktcode **`de0f8f2`** — Feature-Matrix seit TestFlight 2.0 (21), Mac-iOS-Build-Befehle, neuer Agent-Übergabeprompt
- HANDOVER, docs/milestones_active, docs/ios_current, GOiOS, milestones, projektbeschreibung: Übergabe auf HEAD **`5f90ad8`** (Share, Alle-Fünfe-Branding, Gaming-Politur); neuer Übergabeprompt
- HANDOVER, docs/milestones_active, docs/ios_current, GOiOS, milestones, CHANGELOG: TestFlight-Stand auf **2.0 (21)** aktualisiert; nächster Upload **2.0 (22)** (Yatzy-UX seit `cb101f6`)
- HANDOVER, docs/milestones_active, docs/ios_current, CHANGELOG: Stand 2026-06-04 — zentraler Footer für Home/Setup/Play, dunkles Grau als App-Hintergrund, kompakter iPhone-Footer ohne Safe-Area-Abstand, zentrale `/settings`-Seite und Startscreen mit `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`; iOS-Upload 2.0 (7) enthält M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung
- HANDOVER, docs/milestones_active, docs/ios_current, GOiOS, milestones, CHANGELOG: Stand Produktcode **`0b2e25c`** — M34 Bugfixes + Stats-Reset, **M35 Paarungen bearbeiten**, **UI-Politur** und **iPad-Tischmodus**; iOS-Upload 2.0 (7) enthält M34 + M35 + UI-Politur + iPad-Tischmodus
- AGENT_RULES (Sektion 9: Abgleich-Workflow git+server+lokal) unverändert gültig

---

## [Frühere Einträge — M29 Entwicklung]

### Added (M29 Zwischenstände)
- **M29 Würfel-Eintrag (ersetzt):** Wurf-Overlay mit Augenzahl-Häufigkeit — durch Punktwahl ersetzt

### Changed (M29 Zwischenstände)
- Schnellweg Feld-first, Direktwahl Chips, Kontrast-Fixes — konsolidiert in Punktwahl-Finalstand
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
- **Impressum:** `/impressum` mit Anbieterangaben (Marc Langebeck, `frontend/lib/legal.ts`)
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

### Added
- **Legal-Anbieterdaten:** `frontend/lib/legal.ts` (Marc Langebeck, Kiel, netcup); Impressum/Datenschutz ausgefüllt
- Kontakt zentral: `info@bottle-trade.de` in `frontend/lib/branding.ts`

### Changed
- **Impressum/Datenschutz:** Platzhalter durch echte Anbieterangaben ersetzt; Apple-Abschnitt in Datenschutz
- **bottle-trade.de:** Impressum/Datenschutz in `/home/bottleadmin/projects/bottle-trade-platform` analog (ohne Git)

### Docs
- HANDOVER, GOiOS, milestones: Stand Commit `aac288f`, Übergabe-Prompt für nächsten Agent

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
