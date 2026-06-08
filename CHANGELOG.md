# Changelog

Alle relevanten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

### Added
- **Spielanalyse (Head-to-Head):** Nach Multi-Abschluss optional „Spielanalyse“ — abgeleitete Kennzahlen (Attribution, Pool-Effektivität, Yatzy, entscheidender Block/Feld). **2 Spieler:** ein Head-to-Head wie bisher. **3–6 Spieler:** Runden-Ranking, Direktvergleich vs. jeden Mitspieler, Platz/Differenz zur Spitze. Solo analog. Nachträglich unter `/stats/pairing`. Backend: `GET /sessions/invite/:code/match-analysis`
- **Multiplayer: Werten / Nicht werten:** Auf dem Ergebnis-Screen (und beim Verlassen aus der Zettelansicht) steht ein Toggle „Werten“ / „Nicht werten“. Erst beim Verlassen zur Startseite wird die Session finalisiert; bei „Werten“ fließen Liga- und Paarungs-Statistik ein, bei „Nicht werten“ nicht (`include_in_pairing_stats` auf `GameSession`, Endpoint `POST /sessions/invite/:code/finalize-stats`). Bestehende Sessions bleiben durch Default `true` kompatibel
- **Yatzy-Würfel-Strichliste:** Beim Eintrag eines Yatzy (50 Punkte) fragt das Overlay die Augenzahl (1–6) ab; auf dem Zettel erscheint hinter dem passenden Würfel eine goldene Strichliste. Backend-Feld `fields.yatzy_die_value` (nullable, Migration); Solo lokal analog in `localSoloRun.ts`
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
- **Yatzy-Strichliste am Würfel:** Markierung neben der Augenzahl sind kleine Würfel (50 % der Feld-Würfelhöhe) mit der tatsächlichen Augenzahl des Yatzy-Wurfs; etwas Abstand links für den Würfel. Dateien: `ScoreSheetTable.tsx`, `globals.css`
- **Multi-Abschluss „Internal Server Error“:** Beim Klick „Spiel beenden“ auf `finalize-stats` schlug die Session bei nur einem Spieler im Multi-Raum oder offenem Pool-Endspiel fehl; `SessionNotReadyError` wurde nicht im Error-Handler abgefangen (500). Jetzt Abschluss ab einem Spieler, Paarungs-Statistik erst ab zwei, **409** mit deutscher Meldung, Fehlertext auf `RunFinishScreen`. Dateien: `backend/src/services/sessionService.ts`, `backend/src/middleware/errorHandler.ts`, `frontend/components/RunFinishScreen.tsx`
- **Statistik-Button-Kontrast:** Helle `btn-chip`-Buttons im Statistikbereich nutzen nun eine dunkle Schriftfarbe, damit `Paarung bearbeiten` und Alias-Buttons auf weißem Button-Hintergrund lesbar bleiben. Datei: `frontend/app/globals.css`
- **Startscreen-Scroll in iOS-WebView:** Der Startscreen nutzt jetzt einen echten internen `100dvh`-Scrollport (`home-screen`) statt Body-Scroll. Dadurch kann die Home-WebView in iOS/Capacitor zuverlässig vertikal scrollen; `Statistik` und `Einzelspiel` haben zusätzlich mehr Abstand zwischen Motiv und Text. Dateien: `frontend/components/HomeScreenShell.tsx`, `frontend/app/globals.css`
- **Startscreen auf iOS scrollfähig:** Der neue Game-Dashboard-Startscreen war in der alten starren Bento-Höhe zu eng; kleine Kacheln (`Statistik`, `Einzelspiel`) wurden gequetscht und `Raum beitreten` konnte unten angeschnitten werden. Nur der Startscreen ist jetzt vertikal scrollbar, der innere Home-Main blockiert Scrollen nicht mehr, und die Kacheln nutzen stabile Mindesthöhen mit mehr Abstand zwischen Motiv und Text; Spielzettel, Setup- und Play-Screens bleiben unverändert starr. Dateien: `frontend/components/HomeScreenShell.tsx`, `frontend/components/HomeBentoGrid.tsx`, `frontend/app/app/page.tsx`, `frontend/app/globals.css`
- **Punktwahl-Markierung gelb gefüllt:** Im Eintrags-Overlay war der gewählte **Punktwert** nur schwach gelb umrandet (die weiße Grundfläche der `field-score-*-btn` überschrieb wegen gleicher CSS-Spezifität die gelbe Füllung von `play-score-btn--selected`). Jetzt wird der gewählte Wert **gelb ausgefüllt** – genau wie die Auswahl der Würfe-Anzahl. Höher spezifische Regel in `globals.css`
- **Paarungs-Detail in der iOS-App (Capacitor-Fix):** Tippen auf eine Paarung führte in der nativen App zum Start-Screen statt zur Detailansicht. Ursache: die Karte navigierte per normalem `<a href>` (voller Reload), den Capacitor ohne `.html`-Auflösung auf `index.html` → `NativeAppEntry` (Redirect zum Start) zurückfallen ließ. Jetzt clientseitige Navigation via `next/link`. Datei: `components/PairingSummaryCard.tsx`
- **Pool-Endspiel ausführbar (M33-Fix):** Beendete der Pool-Sieger seinen Run **vor** den Mitspielern, erschien die Verbesserungs-Phase nie (ohne Polling kein Nachladen). Der Abschluss-Screen zeigt jetzt „Pool-Endspiel läuft" mit Aktualisieren-Tap; zusammen mit dem Focus-Refresh erhält der Sieger die Verbesserung zuverlässig. Datei: `PlayBoard.tsx`
- **Stats zusammenführen bei Alias:** Spieler-IDs mit demselben lokalen Alias werden in der Statistik wieder als dieselbe Person zusammengeführt (Übersicht + Detail), rein lokal/clientseitig ohne Klarnamen. Neu: `lib/pairingMerge.ts`; angepasst: `app/stats/page.tsx`, `app/stats/pairing/page.tsx`

### Changed
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
- App Store Connect ist bei **Version 2.0**; aktueller TestFlight-Build **2.0 (6)** (Upload durch Nutzer). Build-Nummern zählen pro Versionsstring · nächster Upload = **2.0 (7)** mit M34-Fixes
- M34-Fixes (u. a. Capacitor-Paarungs-Detail) sind **noch nicht** in einem iOS-Build — erst ab 2.0 (7)
- (zuvor, Version 1.0) Build **18** — M33 + Würfe-Standard 3 · **17** — M31 + M32 · **16** — M29 + M30 · **15** — M29

### Docs
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
